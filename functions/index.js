/**
 * DriveUnify – Firebase Cloud Functions
 *
 * Three callable functions handle Google OAuth token lifecycle:
 *   1. exchangeGoogleCode   – swap auth code for tokens (stores refresh_token)
 *   2. refreshGoogleToken   – silently get a new access_token using refresh_token
 *   3. revokeGoogleToken    – revoke & delete tokens on disconnect
 *
 * The refresh_token is ONLY stored in Firestore under a server-only path
 * (drive_tokens collection) that client Firestore rules block entirely.
 * The client NEVER sees the refresh_token.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { google } = require('googleapis');

// ── Init ──────────────────────────────────────────────────────
admin.initializeApp();
const db = admin.firestore();

// Deploy to a region close to your users. us-central1 is free-tier eligible.
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

// Allowed origins: localhost for dev, add your production domain here.
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'https://drive-unify.vercel.app',
  'https://driveunify.vercel.app',
  'https://driveunify.com',
  'https://dashboard.driveunify.com',
  /^https?:\/\/(.+\.)?vercel\.app$/,
  /^https?:\/\/(.+\.)?driveunify\.com$/,
  /^https?:\/\/localhost:[0-9]+$/,
  /^https?:\/\/127\.0\.0\.1:[0-9]+$/
];

// Google OAuth2 client – uses server-side client secret (safe here)
const getOAuth2Client = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ── Helpers ───────────────────────────────────────────────────

/** Sanitize email for use as a Firestore document ID */
const sanitizeEmail = (email) => email.replace(/[@.]/g, '_');

/** Assert the caller is authenticated, return their UID */
const requireAuth = (context) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
  return context.auth.uid;
};

/**
 * Returns true when Google says the refresh token itself is no longer usable
 * (revoked, expired, password changed, etc.). Only these errors should force
 * the user to reconnect — anything else (network, 5xx) is transient.
 */
const isInvalidGrantError = (err) => {
  const code = err?.response?.data?.error || err?.code || '';
  const msg = `${err?.message || ''}`.toLowerCase();
  return code === 'invalid_grant' || code === 'unauthorized_client' || msg.includes('invalid_grant');
};

/** Fetch the user's Google profile using a fresh access_token */
const fetchUserProfile = async (accessToken) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Google user profile');
  return res.json();
};

// ── Firestore paths ───────────────────────────────────────────
// drive_tokens/{uid}/accounts/{emailId}  ← server-only (rules block client access)
// users/{uid}/connected_accounts/{emailId} ← client metadata (no tokens)

const tokenRef = (uid, emailId) =>
  db.doc(`drive_tokens/${uid}/accounts/${emailId}`);

const accountMetaRef = (uid, emailId) =>
  db.doc(`users/${uid}/connected_accounts/${emailId}`);

// ── 1. exchangeGoogleCode ─────────────────────────────────────
/**
 * Called once when user connects a Drive account.
 * Exchanges the auth code for access_token + refresh_token.
 * Stores refresh_token server-side. Returns safe account data to client.
 *
 * @param {string} data.code - Authorization code from Google OAuth popup
 * @param {string} data.redirectUri - Must match what was used to initiate OAuth
 */
exports.exchangeGoogleCode = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = requireAuth(request);
  const { code, redirectUri } = request.data;

  if (!code || !redirectUri) {
    throw new HttpsError('invalid-argument', 'code and redirectUri are required.');
  }

  const oauth2Client = getOAuth2Client();

  let tokens;
  try {
    // Pass the redirect URI explicitly — it must match the one used for the consent screen
    const { tokens: t } = await oauth2Client.getToken({ code, redirect_uri: redirectUri });
    tokens = t;
  } catch (err) {
    console.error('[exchangeGoogleCode] Token exchange failed:', err.message);
    throw new HttpsError('internal', 'Failed to exchange authorization code with Google.');
  }

  // Fetch user profile
  let profile;
  try {
    profile = await fetchUserProfile(tokens.access_token);
  } catch (err) {
    throw new HttpsError('internal', 'Failed to fetch Google profile.');
  }

  const emailId = sanitizeEmail(profile.email);
  const expiryDate = tokens.expiry_date || (Date.now() + 3600 * 1000);

  if (!tokens.refresh_token) {
    // Google only omits the refresh_token when the user already granted offline access.
    // If we still hold a valid one for this account, keep using it instead of failing.
    const existing = await tokenRef(uid, emailId).get();
    if (!existing.exists || !existing.data()?.refreshToken || existing.data()?.invalid) {
      throw new HttpsError(
        'failed-precondition',
        'No refresh_token received. Remove DriveUnify from https://myaccount.google.com/permissions and try again.'
      );
    }
  }

  // Store refresh_token in server-only Firestore path
  await tokenRef(uid, emailId).set({
    email: profile.email,
    ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    scope: tokens.scope,
    invalid: false,
    connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Store safe metadata in client-readable path (NO token here)
  await accountMetaRef(uid, emailId).set({
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    provider: 'google_drive',
    connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Return safe data to the client (access_token is temporary & OK to send)
  return {
    accessToken: tokens.access_token,
    expiryDate,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    scope: tokens.scope,
  };
});

// ── 2. refreshGoogleToken ─────────────────────────────────────
/**
 * Called whenever the client needs a fresh access_token.
 * Silently exchanges the stored refresh_token for a new access_token.
 * No popup, no user interaction needed.
 *
 * @param {string} data.email - The Drive account email to refresh
 */
exports.refreshGoogleToken = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = requireAuth(request);
  const { email } = request.data;

  if (!email) {
    throw new HttpsError('invalid-argument', 'email is required.');
  }

  const emailId = sanitizeEmail(email);
  const snap = await tokenRef(uid, emailId).get();

  if (!snap.exists) {
    throw new HttpsError('not-found', `No stored token found for ${email}. Please reconnect.`);
  }

  const { refreshToken } = snap.data();
  if (!refreshToken) {
    throw new HttpsError('not-found', `Refresh token missing for ${email}. Please reconnect.`);
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  let newTokens;
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    newTokens = credentials;
  } catch (err) {
    console.error(`[refreshGoogleToken] Refresh failed for ${email}:`, err.message);
    if (isInvalidGrantError(err)) {
      // Refresh token was revoked/expired — the user must go through OAuth again
      await tokenRef(uid, emailId).update({ invalid: true }).catch(() => {});
      throw new HttpsError('unauthenticated', `Token for ${email} is invalid or revoked. Please reconnect.`);
    }
    // Network hiccup / Google 5xx — tell the client to retry, don't force a reconnect
    throw new HttpsError('unavailable', `Could not refresh the token for ${email} right now. Please try again.`);
  }

  const expiryDate = newTokens.expiry_date || (Date.now() + 3600 * 1000);

  // Update timestamp (and persist a rotated refresh token if Google issued one)
  await tokenRef(uid, emailId).update({
    ...(newTokens.refresh_token ? { refreshToken: newTokens.refresh_token } : {}),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    invalid: false,
  });

  return {
    accessToken: newTokens.access_token,
    expiryDate,
    email,
  };
});

// ── 3. revokeGoogleToken ──────────────────────────────────────
/**
 * Called when a user disconnects a Drive account.
 * Revokes the refresh_token with Google and deletes all stored data.
 *
 * @param {string} data.email - The Drive account email to revoke
 */
exports.revokeGoogleToken = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = requireAuth(request);
  const { email } = request.data;

  if (!email) {
    throw new HttpsError('invalid-argument', 'email is required.');
  }

  const emailId = sanitizeEmail(email);
  const snap = await tokenRef(uid, emailId).get();

  if (snap.exists) {
    const { refreshToken } = snap.data();
    if (refreshToken) {
      try {
        const oauth2Client = getOAuth2Client();
        await oauth2Client.revokeToken(refreshToken);
      } catch (err) {
        // Best-effort — log but don't fail the request
        console.warn(`[revokeGoogleToken] Revoke call failed for ${email}:`, err.message);
      }
    }
    // Delete server-side token record
    await tokenRef(uid, emailId).delete();
  }

  // Delete client-readable metadata
  try {
    await accountMetaRef(uid, emailId).delete();
  } catch {
    // Best-effort
  }

  return { success: true };
});

// ── Dropbox Token Lifecycle Functions ─────────────────────────
const dropboxTokenRef = (uid, emailId) =>
  db.doc(`dropbox_tokens/${uid}/accounts/${emailId}`);

const getDropboxClientId = () => process.env.DROPBOX_CLIENT_ID || process.env.DROPBOX_APP_KEY;
const getDropboxClientSecret = () => process.env.DROPBOX_CLIENT_SECRET || process.env.DROPBOX_APP_SECRET;

/**
 * 4. exchangeDropboxCode
 * Exchanges authorization code for Dropbox access_token + refresh_token.
 * Saves refresh_token to server-only Firestore path (dropbox_tokens/).
 */
exports.exchangeDropboxCode = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = requireAuth(request);
  const { code, redirectUri, codeVerifier, clientId: clientProvidedId } = request.data;

  if (!code || !redirectUri) {
    throw new HttpsError('invalid-argument', 'code and redirectUri are required.');
  }

  const clientId = clientProvidedId || getDropboxClientId();
  const clientSecret = getDropboxClientSecret();

  const params = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    client_id: clientId,
  });

  if (codeVerifier) {
    params.set('code_verifier', codeVerifier);
  }
  if (clientSecret) {
    params.set('client_secret', clientSecret);
  }

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (clientSecret && clientId && !codeVerifier) {
    headers['Authorization'] = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
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
    throw new HttpsError('internal', 'Failed to exchange authorization code with Dropbox.');
  }

  // Fetch Dropbox user profile
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
    throw new HttpsError('internal', 'Failed to fetch Dropbox profile.');
  }

  const emailId = sanitizeEmail(profile.email);
  const expiryDate = Date.now() + (tokens.expires_in || 14400) * 1000;

  // Store refresh_token server-side in dropbox_tokens
  await dropboxTokenRef(uid, emailId).set({
    email: profile.email,
    ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    accountId: profile.account_id,
    invalid: false,
    connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Store client-readable metadata
  await accountMetaRef(uid, emailId).set({
    email: profile.email,
    name: profile.name?.display_name || profile.email,
    picture: profile.profile_photo_url || null,
    provider: 'dropbox',
    connectedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    accessToken: tokens.access_token,
    expiryDate,
    email: profile.email,
    name: profile.name?.display_name || profile.email,
    picture: profile.profile_photo_url || null,
    provider: 'dropbox',
    refreshToken: tokens.refresh_token || null,
  };
});

/**
 * 5. refreshDropboxToken
 * Refreshes Dropbox access token using stored refresh_token.
 */
exports.refreshDropboxToken = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = requireAuth(request);
  const { email } = request.data;

  if (!email) {
    throw new HttpsError('invalid-argument', 'email is required.');
  }

  const emailId = sanitizeEmail(email);
  const snap = await dropboxTokenRef(uid, emailId).get();

  if (!snap.exists) {
    throw new HttpsError('not-found', `No stored token found for ${email}. Please reconnect.`);
  }

  const { refreshToken } = snap.data();
  if (!refreshToken) {
    throw new HttpsError('not-found', `Refresh token missing for ${email}. Please reconnect.`);
  }

  const clientId = getDropboxClientId();
  const clientSecret = getDropboxClientSecret();

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });
  if (clientSecret) {
    params.set('client_secret', clientSecret);
  }

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
    throw new HttpsError('unavailable', `Could not refresh Dropbox token for ${email}. Please try again.`);
  }

  const expiryDate = Date.now() + (tokens.expires_in || 14400) * 1000;

  await dropboxTokenRef(uid, emailId).update({
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    invalid: false,
  });

  return {
    accessToken: tokens.access_token,
    expiryDate,
    email,
    provider: 'dropbox',
  };
});

/**
 * 6. revokeDropboxToken
 * Revokes Dropbox token and deletes stored Firestore credentials.
 */
exports.revokeDropboxToken = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  const uid = requireAuth(request);
  const { email } = request.data;

  if (!email) {
    throw new HttpsError('invalid-argument', 'email is required.');
  }

  const emailId = sanitizeEmail(email);
  const snap = await dropboxTokenRef(uid, emailId).get();

  if (snap.exists) {
    await dropboxTokenRef(uid, emailId).delete();
  }

  try {
    await accountMetaRef(uid, emailId).delete();
  } catch {
    // Best-effort
  }

  return { success: true };
});

