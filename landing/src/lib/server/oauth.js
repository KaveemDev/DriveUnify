import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function adminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID
    || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    || 'drivehub-dddd8';
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (json) {
    return initializeApp({ credential: cert(JSON.parse(json)) });
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ projectId });
  }

  throw fail(
    'internal',
    'Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.'
  );
}

const db = () => getFirestore(adminApp());

const sanitizeEmail = (email) => email.replace(/[@.]/g, '_');

async function requireUid(idToken) {
  if (!idToken) throw fail('unauthenticated', 'You must be signed in.');
  try {
    const decoded = await getAuth(adminApp()).verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    throw fail('unauthenticated', 'You must be signed in.');
  }
}

function assertRedirectUri(redirectUri) {
  let url;
  try {
    url = new URL(redirectUri);
  } catch {
    throw fail('invalid-argument', 'redirectUri is invalid.');
  }
  if (url.pathname !== '/oauth/callback') {
    throw fail('invalid-argument', 'redirectUri is not allowed.');
  }
  const host = url.hostname;
  const local = host === 'localhost' || host === '127.0.0.1';
  const hosted = host === 'driveunify.com' || host.endsWith('.driveunify.com') || host.endsWith('.vercel.app');
  if (local && (url.protocol === 'http:' || url.protocol === 'https:')) return;
  if (hosted && url.protocol === 'https:') return;
  throw fail('invalid-argument', 'redirectUri is not allowed.');
}

const tokenRef = (uid, emailId) => db().doc(`drive_tokens/${uid}/accounts/${emailId}`);
const dropboxTokenRef = (uid, emailId) => db().doc(`dropbox_tokens/${uid}/accounts/${emailId}`);
const accountMetaRef = (uid, emailId) => db().doc(`users/${uid}/connected_accounts/${emailId}`);

const isInvalidGrant = (data) => {
  const code = data?.error || '';
  return code === 'invalid_grant' || code === 'unauthorized_client';
};

async function googleToken(params) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw fail('internal', 'Google OAuth client credentials are not configured.');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = fail('internal', 'Google token request failed.');
    error.googleError = data.error || '';
    throw error;
  }
  return data;
}

async function fetchGoogleProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw fail('internal', 'Failed to fetch Google profile.');
  return res.json();
}

async function exchangeGoogleCode(uid, { code, redirectUri }) {
  if (!code || !redirectUri) throw fail('invalid-argument', 'code and redirectUri are required.');
  assertRedirectUri(redirectUri);

  let tokens;
  try {
    tokens = await googleToken({
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
  } catch (err) {
    console.error('[exchangeGoogleCode] Token exchange failed:', err.message);
    throw fail('internal', 'Failed to exchange authorization code with Google.');
  }

  const profile = await fetchGoogleProfile(tokens.access_token);
  const emailId = sanitizeEmail(profile.email);
  const expiryDate = Date.now() + (tokens.expires_in || 3600) * 1000;

  if (!tokens.refresh_token) {
    const existing = await tokenRef(uid, emailId).get();
    if (!existing.exists || !existing.data()?.refreshToken || existing.data()?.invalid) {
      throw fail(
        'failed-precondition',
        'No refresh_token received. Remove DriveUnify from https://myaccount.google.com/permissions and try again.'
      );
    }
  }

  await tokenRef(uid, emailId).set({
    email: profile.email,
    ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    scope: tokens.scope,
    invalid: false,
    connectedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await accountMetaRef(uid, emailId).set({
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    provider: 'google_drive',
    connectedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    accessToken: tokens.access_token,
    expiryDate,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    scope: tokens.scope,
  };
}

async function refreshGoogleToken(uid, { email }) {
  if (!email) throw fail('invalid-argument', 'email is required.');
  const emailId = sanitizeEmail(email);
  const snap = await tokenRef(uid, emailId).get();
  if (!snap.exists) throw fail('not-found', `No stored token found for ${email}. Please reconnect.`);
  const { refreshToken } = snap.data();
  if (!refreshToken) throw fail('not-found', `Refresh token missing for ${email}. Please reconnect.`);

  let tokens;
  try {
    tokens = await googleToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
  } catch (err) {
    console.error(`[refreshGoogleToken] Refresh failed for ${email}:`, err.message);
    if (isInvalidGrant({ error: err.googleError })) {
      await tokenRef(uid, emailId).update({ invalid: true }).catch(() => {});
      throw fail('unauthenticated', `Token for ${email} is invalid or revoked. Please reconnect.`);
    }
    throw fail('unavailable', `Could not refresh the token for ${email} right now. Please try again.`);
  }

  const expiryDate = Date.now() + (tokens.expires_in || 3600) * 1000;
  await tokenRef(uid, emailId).update({
    ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    updatedAt: FieldValue.serverTimestamp(),
    invalid: false,
  });

  return { accessToken: tokens.access_token, expiryDate, email };
}

async function revokeGoogleToken(uid, { email }) {
  if (!email) throw fail('invalid-argument', 'email is required.');
  const emailId = sanitizeEmail(email);
  const snap = await tokenRef(uid, emailId).get();

  if (snap.exists) {
    const { refreshToken } = snap.data();
    if (refreshToken) {
      try {
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: refreshToken }),
        });
      } catch (err) {
        console.warn(`[revokeGoogleToken] Revoke call failed for ${email}:`, err.message);
      }
    }
    await tokenRef(uid, emailId).delete();
  }

  try {
    await accountMetaRef(uid, emailId).delete();
  } catch {
    // Best-effort
  }

  return { success: true };
}

function dropboxClientId(provided) {
  return provided || process.env.DROPBOX_CLIENT_ID || process.env.DROPBOX_APP_KEY || '';
}

function dropboxClientSecret() {
  return process.env.DROPBOX_CLIENT_SECRET || process.env.DROPBOX_APP_SECRET || '';
}

async function exchangeDropboxCode(uid, { code, redirectUri, codeVerifier, clientId: clientProvidedId }) {
  if (!code || !redirectUri) throw fail('invalid-argument', 'code and redirectUri are required.');
  assertRedirectUri(redirectUri);

  const clientId = dropboxClientId(clientProvidedId);
  const clientSecret = dropboxClientSecret();
  const params = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    client_id: clientId,
  });
  if (codeVerifier) params.set('code_verifier', codeVerifier);
  if (clientSecret) params.set('client_secret', clientSecret);

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (clientSecret && clientId && !codeVerifier) {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
  }

  let tokens;
  try {
    const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers,
      body: params.toString(),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    tokens = await res.json();
  } catch (err) {
    console.error('[exchangeDropboxCode] Token exchange failed:', err.message);
    throw fail('internal', 'Failed to exchange authorization code with Dropbox.');
  }

  let profile;
  try {
    const profileRes = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) throw new Error(`HTTP ${profileRes.status}`);
    profile = await profileRes.json();
  } catch (err) {
    console.error('[exchangeDropboxCode] Profile fetch failed:', err.message);
    throw fail('internal', 'Failed to fetch Dropbox profile.');
  }

  const emailId = sanitizeEmail(profile.email);
  const expiryDate = Date.now() + (tokens.expires_in || 14400) * 1000;

  await dropboxTokenRef(uid, emailId).set({
    email: profile.email,
    ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    accountId: profile.account_id,
    invalid: false,
    connectedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await accountMetaRef(uid, emailId).set({
    email: profile.email,
    name: profile.name?.display_name || profile.email,
    picture: profile.profile_photo_url || null,
    provider: 'dropbox',
    connectedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    accessToken: tokens.access_token,
    expiryDate,
    email: profile.email,
    name: profile.name?.display_name || profile.email,
    picture: profile.profile_photo_url || null,
    provider: 'dropbox',
  };
}

async function refreshDropboxToken(uid, { email }) {
  if (!email) throw fail('invalid-argument', 'email is required.');
  const emailId = sanitizeEmail(email);
  const snap = await dropboxTokenRef(uid, emailId).get();
  if (!snap.exists) throw fail('not-found', `No stored token found for ${email}. Please reconnect.`);
  const { refreshToken } = snap.data();
  if (!refreshToken) throw fail('not-found', `Refresh token missing for ${email}. Please reconnect.`);

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: dropboxClientId(),
  });
  const clientSecret = dropboxClientSecret();
  if (clientSecret) params.set('client_secret', clientSecret);

  let tokens;
  try {
    const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    tokens = await res.json();
  } catch (err) {
    console.error(`[refreshDropboxToken] Refresh failed for ${email}:`, err.message);
    throw fail('unavailable', `Could not refresh Dropbox token for ${email}. Please try again.`);
  }

  await dropboxTokenRef(uid, emailId).update({
    updatedAt: FieldValue.serverTimestamp(),
    invalid: false,
  });

  return {
    accessToken: tokens.access_token,
    expiryDate: Date.now() + (tokens.expires_in || 14400) * 1000,
    email,
    provider: 'dropbox',
  };
}

async function revokeDropboxToken(uid, { email }) {
  if (!email) throw fail('invalid-argument', 'email is required.');
  const emailId = sanitizeEmail(email);
  const snap = await dropboxTokenRef(uid, emailId).get();
  if (snap.exists) await dropboxTokenRef(uid, emailId).delete();
  try {
    await accountMetaRef(uid, emailId).delete();
  } catch {
    // Best-effort
  }
  return { success: true };
}

const OPS = {
  exchangeGoogleCode,
  refreshGoogleToken,
  revokeGoogleToken,
  exchangeDropboxCode,
  refreshDropboxToken,
  revokeDropboxToken,
};

export async function handleOAuth(idToken, body) {
  const op = OPS[body?.op];
  if (!op) throw fail('invalid-argument', 'Unknown operation.');
  const uid = await requireUid(idToken);
  return op(uid, body || {});
}
