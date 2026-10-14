/**
 * Cross-subdomain Auth Session Synchronization for Next.js Landing
 */

const COOKIE_NAME = 'driveunify_session';

export const getRootDomain = () => {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname.includes('driveunify.com')) {
    return '.driveunify.com';
  }
  return '';
};

export const getDashboardUrl = () => {
  if (process.env.NEXT_PUBLIC_DASHBOARD_URL) {
    return process.env.NEXT_PUBLIC_DASHBOARD_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5173';
    }
    if (hostname.endsWith('.vercel.app')) {
      return window.location.origin;
    }
  }
  return 'https://dashboard.driveunify.com';
};

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
        return null;
      }
    }
  }
  return null;
};

export const clearCrossDomainSession = () => {
  if (typeof document === 'undefined') return;

  const domain = getRootDomain();
  const domainAttr = domain ? `; domain=${domain}` : '';
  document.cookie = `${COOKIE_NAME}=; path=/${domainAttr}; max-age=0; samesite=lax`;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
};
