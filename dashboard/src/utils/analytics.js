// Google Analytics event tracking
// No-op if VITE_GA_MEASUREMENT_ID is not set

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initAnalytics = () => {
  if (!GA_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
};

export const trackEvent = (name, params = {}) => {
  if (!GA_ID || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
};

// Predefined event helpers
export const analytics = {
  userSignedIn: (method) => trackEvent('user_signed_in', { method }),
  accountConnected: (email) => trackEvent('account_connected', { email }),
  accountDisconnected: (email) => trackEvent('account_disconnected', { email }),
  fileUploaded: (fileType, size) => trackEvent('file_uploaded', { file_type: fileType, file_size: size }),
  fileDownloaded: (fileType) => trackEvent('file_downloaded', { file_type: fileType }),
  searchPerformed: (query) => trackEvent('search_performed', { search_term: query }),
  viewModeChanged: (mode) => trackEvent('view_mode_changed', { mode }),
  fileDeleted: () => trackEvent('file_deleted'),
  fileRenamed: () => trackEvent('file_renamed'),
};
