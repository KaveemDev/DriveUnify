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
  'http://localhost:3000',
  'http://localhost:4173',
  // Add your production domain, e.g.: 'https://drivehub.example.com'
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
  // Override redirect URI with the one sent from the client
  oauth2Client.redirectUri = redirectUri;

  let tokens;
  try {
    const { tokens: t } = await oauth2Client.getToken(code);
    tokens = t;
  } catch (err) {
    console.error('[exchangeGoogleCode] Token exchange failed:', err.message);
    throw new HttpsError('internal', 'Failed to exchange authorization code with Google.');
  }

  if (!tokens.refresh_token) {
    // This happens if the user already granted access before.
    // We need to prompt=consent to always get a refresh_token.
    throw new HttpsError(
      'failed-precondition',
      'No refresh_token received. Please disconnect any existing Google authorization and try again.'
    );
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

  // Store refresh_token in server-only Firestore path
  await tokenRef(uid, emailId).set({
    email: profile.email,
    refreshToken: tokens.refresh_token,
    scope: tokens.scope,
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
    // Mark the stored token as invalid so the client shows "Re-connect"
    await tokenRef(uid, emailId).update({ invalid: true });
    throw new HttpsError('unauthenticated', `Token for ${email} is invalid or revoked. Please reconnect.`);
  }

  const expiryDate = newTokens.expiry_date || (Date.now() + 3600 * 1000);

  // Update timestamp
  await tokenRef(uid, emailId).update({
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
