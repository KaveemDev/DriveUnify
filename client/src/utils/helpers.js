import { clsx } from 'clsx';

export { clsx };

// ── Download a file via URL ───────────────────────────────────
export const downloadFile = (url, filename, accessToken) => {
  const a = document.createElement('a');
  if (accessToken) {
    fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(res => res.blob())
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(objectUrl);
      });
  } else {
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.click();
  }
};

// ── Copy text to clipboard ────────────────────────────────────
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
};

// ── Open file in Google Drive ─────────────────────────────────
export const openInGoogleDrive = (file) => {
  const url = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

// ── Get Drive folder link ─────────────────────────────────────
export const getFolderLink = (folderId) =>
  `https://drive.google.com/drive/folders/${folderId}`;

// ── Group files by account ────────────────────────────────────
export const groupByAccount = (files) => {
  return files.reduce((acc, file) => {
    if (!acc[file.accountEmail]) acc[file.accountEmail] = [];
    acc[file.accountEmail].push(file);
    return acc;
  }, {});
};

// ── Generate unique ID ────────────────────────────────────────
export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ── Debounce ──────────────────────────────────────────────────
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// ── Is Google Apps type (no downloadable content) ─────────────
export const isGoogleAppsFile = (mimeType) =>
  mimeType?.startsWith('application/vnd.google-apps.') &&
  mimeType !== 'application/vnd.google-apps.folder';

// ── Is folder ─────────────────────────────────────────────────
export const isFolder = (file) =>
  file?.mimeType === 'application/vnd.google-apps.folder';

// ── Is previewable image ──────────────────────────────────────
export const isPreviewableImage = (mimeType) =>
  ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(mimeType);

// ── Is previewable video ──────────────────────────────────────
export const isPreviewableVideo = (mimeType) =>
  ['video/mp4', 'video/webm', 'video/ogg'].includes(mimeType);
