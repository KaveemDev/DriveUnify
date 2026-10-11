/**
 * Cross-subdomain Auth Session Synchronization
 *
 * Enables seamless Single Sign-On (SSO) between:
 *  - driveunify.com (Next.js landing page)
 *  - dashboard.driveunify.com (React-Vite dashboard)
 *
 * In production: cookie domain is `.driveunify.com`
 * In local development: cookie domain is `localhost` (shared across all localhost ports)
 */

const COOKIE_NAME = 'driveunify_session';

const getRootDomain = () => {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname.includes('driveunify.com')) {
    return '.driveunify.com';
  }
  return '';
};

export const getLandingUrl = () => {
  if (typeof window === 'undefined') return 'https://driveunify.com';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  return 'https://driveunify.com';
};

export const getDashboardUrl = () => {
  if (typeof window === 'undefined') return 'https://dashboard.driveunify.com';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5173';
  }
  return 'https://dashboard.driveunify.com';
};

/**
 * Set the cross-subdomain session cookie
 */
export const setCrossDomainSession = (userData, idToken = '') => {
  if (typeof document === 'undefined') return;

  const sessionPayload = {
    uid: userData.uid,
    email: userData.email,
    displayName: userData.displayName || '',
    photoURL: userData.photoURL || '',
    token: idToken,
    updatedAt: Date.now(),
  };

  const serialized = encodeURIComponent(JSON.stringify(sessionPayload));
  const domain = getRootDomain();
  const domainAttr = domain ? `; domain=${domain}` : '';
  const secureAttr = window.location.protocol === 'https:' ? '; secure' : '';
  const maxAge = 60 * 60 * 24 * 30; // 30 days

  document.cookie = `${COOKIE_NAME}=${serialized}; path=/${domainAttr}; max-age=${maxAge}; samesite=lax${secureAttr}`;
};

/**
 * Read the cross-subdomain session cookie
 */
export const getCrossDomainSession = () => {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, ...val] = cookie.trim().split('=');
    if (name === COOKIE_NAME) {
      try {
        const decoded = decodeURIComponent(val.join('='));
        return JSON.parse(decoded);
      } catch (e) {
        console.warn('[DriveUnify] Failed to parse cross-domain session cookie:', e);
        return null;
      }
    }
  }
  return null;
};

/**
 * Clear the cross-subdomain session cookie
 */
export const clearCrossDomainSession = () => {
  if (typeof document === 'undefined') return;

  const domain = getRootDomain();
  const domainAttr = domain ? `; domain=${domain}` : '';
  document.cookie = `${COOKIE_NAME}=; path=/${domainAttr}; max-age=0; samesite=lax`;
  // Fallback clear for current host
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
};
