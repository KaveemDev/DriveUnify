/**
 * services/dropbox/auth.js
 *
 * Handles Dropbox OAuth 2.0 (PKCE & Authorization Code flow).
 * Seamlessly integrates with Firebase Cloud Functions for serverless token exchange,
 * with resilient client-side PKCE fallback.
 */

import { getCurrentDropboxAccount } from '../../api/dropboxApi';
import { callOAuth } from '../serverApi';

const DROPBOX_CLIENT_ID = process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID || '';

export const getDropboxRedirectUri = () => {
  if (typeof window === 'undefined') return '';
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    return `${window.location.origin}/oauth/callback`;
  }
  const configuredUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI;
  if (configuredUri && !configuredUri.includes('localhost') && !configuredUri.includes('127.0.0.1')) {
    return configuredUri;
  }
  return `${window.location.origin}/oauth/callback`;
};

// ── PKCE Helpers ──────────────────────────────────────────────

function generateRandomString(length = 64) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((v) => charset[v % charset.length])
    .join('');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── Open OAuth Popup ──────────────────────────────────────────

const openDropboxOAuthPopup = async (clientIdToUse) => {
  const storedClientId = typeof window !== 'undefined' ? localStorage.getItem('driveunify_dropbox_client_id') : null;
  const clientId = clientIdToUse || DROPBOX_CLIENT_ID || storedClientId;
  if (!clientId || clientId === 'dropbox-client-id') {
    throw new Error(
      'Dropbox App Key (Client ID) is missing. Please set NEXT_PUBLIC_DROPBOX_CLIENT_ID.'
    );
  }
  const redirectUri = getDropboxRedirectUri();
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const stateObj = { provider: 'dropbox', nonce: generateRandomString(16) };
  const stateStr = encodeURIComponent(JSON.stringify(stateObj));

  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${encodeURIComponent(
    clientId
  )}&response_type=code&token_access_type=offline&code_challenge=${encodeURIComponent(
    codeChallenge
  )}&code_challenge_method=S256&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateStr}`;

  return new Promise((resolve, reject) => {
    const width = 560;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'DriveUnify Dropbox OAuth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      reject(new Error('Popup was blocked by your browser. Please allow popups for DriveUnify.'));
      return;
    }

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data?.type?.startsWith('OAUTH_')) return;

      cleanup();

      if (event.data.type === 'OAUTH_CODE') {
        resolve({ code: event.data.code, codeVerifier, clientId });
      } else if (event.data.type === 'OAUTH_ERROR') {
        reject(new Error(event.data.error || 'Dropbox OAuth failed'));
      }
    };

    const pollClosed = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          cleanup();
          reject(new Error('OAuth popup was closed by user'));
        }
      } catch {
        // Cross-Origin-Opener-Policy: browser may log a warning while popup is cross-origin
      }
    }, 1000);

    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pollClosed);
      try {
        popup.close();
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('message', handleMessage);
  });
};

// ── Connect Dropbox Account ───────────────────────────────────

export const requestDropboxAccess = async (customAppKey = null) => {
  const { code, codeVerifier, clientId } = await openDropboxOAuthPopup(customAppKey);
  const redirectUri = getDropboxRedirectUri();

  try {
    const data = await callOAuth('exchangeDropboxCode', { code, redirectUri, codeVerifier, clientId });
    if (data?.accessToken) {
      return {
        accessToken: data.accessToken,
        expiryDate: data.expiryDate,
        email: data.email,
        name: data.name,
        picture: data.picture,
        provider: 'dropbox',
      };
    }
  } catch (err) {
    console.warn('[DriveUnify] Server Dropbox exchange unavailable, falling back to direct PKCE exchange:', err.message);
  }

  // Strategy 2: Direct Client PKCE Exchange
  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const tokenRes = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => '');
    throw new Error(`Failed to exchange Dropbox authorization code: HTTP ${tokenRes.status} ${errText}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in || 14400; // default 4 hrs
  const expiryDate = Date.now() + expiresIn * 1000;

  // Fetch Dropbox user profile
  const userProfile = await getCurrentDropboxAccount(accessToken);

  if (typeof window !== 'undefined' && clientId) {
    try {
      localStorage.setItem('driveunify_dropbox_client_id', clientId);
    } catch {
      /* ignore */
    }
  }

  return {
    accessToken,
    refreshToken,
    expiryDate,
    email: userProfile.email,
    name: userProfile.name?.display_name || userProfile.email,
    picture: userProfile.profile_photo_url || null,
    provider: 'dropbox',
    accountId: userProfile.account_id,
    clientId,
  };
};

// In-flight refresh map
const _inFlightDropboxRefreshes = new Map();

export const refreshDropboxToken = async (account) => {
  if (_inFlightDropboxRefreshes.has(account.email)) {
    return _inFlightDropboxRefreshes.get(account.email);
  }

  const refreshPromise = (async () => {
    try {
      const data = await callOAuth('refreshDropboxToken', { email: account.email });
      if (data?.accessToken) {
        return {
          ...account,
          accessToken: data.accessToken,
          expiryDate: data.expiryDate,
          needsReconnect: false,
          expired: false,
        };
      }
    } catch (err) {
      console.warn(`[DriveUnify] Server Dropbox refresh failed for ${account.email}:`, err.message);
    }

    // 2. Direct PKCE refresh fallback if refreshToken is stored locally
    if (account.refreshToken) {
      const storedClientId = typeof window !== 'undefined' ? localStorage.getItem('driveunify_dropbox_client_id') : null;
      const clientId = account.clientId || DROPBOX_CLIENT_ID || storedClientId;

      if (!clientId) {
        console.warn(`[DriveUnify] Cannot refresh Dropbox token for ${account.email}: missing clientId / App Key.`);
        return { ...account, accessToken: null, needsReconnect: true, expired: true };
      }

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: account.refreshToken,
        client_id: clientId,
      });

      const tokenRes = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (tokenRes.ok) {
        const data = await tokenRes.json();
        const expiresIn = data.expires_in || 14400;
        return {
          ...account,
          accessToken: data.access_token,
          expiryDate: Date.now() + expiresIn * 1000,
          needsReconnect: false,
          expired: false,
        };
      }
    }

    return { ...account, accessToken: null, needsReconnect: true, expired: true };
  })().finally(() => {
    _inFlightDropboxRefreshes.delete(account.email);
  });

  _inFlightDropboxRefreshes.set(account.email, refreshPromise);
  return refreshPromise;
};

export const silentRefreshDropboxAccount = async (account) => {
  try {
    return await refreshDropboxToken(account);
  } catch {
    return { ...account, accessToken: null, needsReconnect: true, expired: true };
  }
};

export const checkAndRefreshDropboxToken = async (account) => {
  const FIVE_MINUTES = 5 * 60 * 1000;
  const isExpiringSoon = !account.expiryDate || account.expiryDate - Date.now() < FIVE_MINUTES;

  if (!isExpiringSoon && account.accessToken) return account;
  return refreshDropboxToken(account);
};

export const revokeDropboxAccess = async (email, accessToken = null) => {
  try {
    await callOAuth('revokeDropboxToken', { email });
  } catch {
    // best-effort
  }

  if (accessToken) {
    try {
      await fetch('https://api.dropboxapi.com/2/auth/token/revoke', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // best-effort
    }
  }
};
