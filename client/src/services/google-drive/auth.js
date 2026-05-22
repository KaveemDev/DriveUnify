/**
 * google-drive/auth.js
 *
 * Handles Google Drive OAuth using the Authorization Code flow.
 * Access tokens and refresh tokens are managed by Firebase Cloud Functions.
 *
 * Flow:
 *   1. requestDriveAccess() opens a popup → user grants consent → auth code
 *   2. exchangeGoogleCode CF exchanges code → returns access_token
 *   3. refreshGoogleToken CF silently refreshes when token expires
 *   4. revokeGoogleToken CF cleans up on disconnect
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../config/firebase';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/oauth/callback`;

const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// ── Firebase Functions references ─────────────────────────────
let _functions = null;
const getFns = () => {
  if (!_functions && app) {
    _functions = getFunctions(app, 'us-central1');
  }
  return _functions;
};

// ── Build Google OAuth authorization URL ──────────────────────

const buildAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_DRIVE_SCOPES.join(' '),
    access_type: 'offline',      // Required to get refresh_token
    prompt: 'consent',           // Always show consent to guarantee refresh_token
    include_granted_scopes: 'true',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

// ── Open OAuth popup and wait for auth code ───────────────────

const openOAuthPopup = () => {
  return new Promise((resolve, reject) => {
    const authUrl = buildAuthUrl();
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'DriveUnify OAuth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      reject(new Error('Popup was blocked. Please allow popups for this site.'));
      return;
    }

    // Listen for the postMessage from OAuthCallback page
    const handleMessage = (event) => {
      // Security: only accept messages from our own origin
      if (event.origin !== window.location.origin) return;
      if (!event.data?.type?.startsWith('OAUTH_')) return;

      cleanup();

      if (event.data.type === 'OAUTH_CODE') {
        resolve(event.data.code);
      } else if (event.data.type === 'OAUTH_ERROR') {
        reject(new Error(event.data.error || 'OAuth failed'));
      }
    };

    // Poll for popup close (user closed it manually)
    const pollClosed = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('OAuth popup was closed'));
      }
    }, 500);

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pollClosed);
      try { popup.close(); } catch { /* ignore */ }
    };

    window.addEventListener('message', handleMessage);
  });
};

// ── 1. Connect a new Drive account ───────────────────────────
/**
 * Opens an OAuth popup, gets an auth code, sends it to the Cloud Function
 * to exchange for tokens. Returns safe account data (no refresh_token).
 */
export const requestDriveAccess = async () => {
  const fns = getFns();
  if (!fns) throw new Error('Firebase not initialized. Check your .env file.');

  // Step 1: Open popup and get auth code
  const code = await openOAuthPopup();

  // Step 2: Exchange code via Cloud Function (client_secret stays on server)
  const exchangeFn = httpsCallable(fns, 'exchangeGoogleCode');
  const result = await exchangeFn({ code, redirectUri: REDIRECT_URI });

  if (!result.data) throw new Error('No data returned from token exchange');

  return {
    accessToken: result.data.accessToken,
    expiryDate: result.data.expiryDate,
    email: result.data.email,
    name: result.data.name,
    picture: result.data.picture,
    scope: result.data.scope,
  };
};

// ── 2. Refresh an expired/expiring token silently ─────────────
/**
 * Calls refreshGoogleToken Cloud Function with the user's Firebase auth.
 * Returns updated account data with fresh accessToken.
 * Never shows a popup — works even after weeks.
 */
export const refreshDriveToken = async (account) => {
  const fns = getFns();
  if (!fns) throw new Error('Firebase not initialized.');

  try {
    const refreshFn = httpsCallable(fns, 'refreshGoogleToken');
    const result = await refreshFn({ email: account.email });

    if (!result.data?.accessToken) {
      throw new Error('No access token in refresh response');
    }

    return {
      ...account,
      accessToken: result.data.accessToken,
      expiryDate: result.data.expiryDate,
      needsReconnect: false,
      expired: false,
    };
  } catch (err) {
    console.warn(`[DriveUnify] Token refresh failed for ${account.email}:`, err.message);
    // If the CF says token is invalid/revoked, mark account as needing reconnect
    if (err.code === 'functions/unauthenticated' || err.code === 'functions/not-found') {
      return { ...account, accessToken: null, needsReconnect: true, expired: true };
    }
    throw err;
  }
};

// ── 3. Silent refresh on app load ─────────────────────────────
/**
 * Same as refreshDriveToken but never throws — always returns an account object.
 * Used on app load to refresh all connected accounts without showing errors.
 */
export const silentRefreshAccount = async (account) => {
  try {
    return await refreshDriveToken(account);
  } catch {
    return { ...account, accessToken: null, needsReconnect: true, expired: true };
  }
};

// ── 4. Check token expiry and refresh if needed ───────────────
/**
 * Checks if the current access token is expiring soon (< 5 min).
 * If so, refreshes via Cloud Function. Otherwise returns account unchanged.
 */
export const checkAndRefreshToken = async (account) => {
  const FIVE_MINUTES = 5 * 60 * 1000;
  const isExpiringSoon = !account.expiryDate || (account.expiryDate - Date.now()) < FIVE_MINUTES;

  if (!isExpiringSoon) return account;
  return refreshDriveToken(account);
};

// ── 5. Revoke a token (on disconnect) ─────────────────────────
/**
 * Calls revokeGoogleToken Cloud Function to:
 * - Revoke the token with Google
 * - Delete all stored token data from Firestore
 */
export const revokeDriveAccess = async (email) => {
  const fns = getFns();
  if (!fns) return; // Best-effort

  try {
    const revokeFn = httpsCallable(fns, 'revokeGoogleToken');
    await revokeFn({ email });
  } catch (err) {
    console.warn(`[DriveUnify] Revoke failed for ${email}:`, err.message);
    // Non-fatal — token will expire naturally
  }
};
