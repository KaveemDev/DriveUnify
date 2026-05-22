import { formatDistanceToNow, format } from 'date-fns';

// ── File size formatter ───────────────────────────────────────
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

// ── Date formatters ───────────────────────────────────────────
export const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '—';
  }
};

export const formatAbsoluteDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return '—';
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  } catch {
    return '—';
  }
};

// ── Storage percentage ────────────────────────────────────────
export const formatStoragePercent = (used, total) => {
  if (!total || total === 0) return '0%';
  return `${Math.min(100, Math.round((used / total) * 100))}%`;
};

// ── Truncate text ─────────────────────────────────────────────
export const truncate = (str, maxLength = 30) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

// ── Email initials ────────────────────────────────────────────
export const getInitials = (email) => {
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

// ── Display name from email ───────────────────────────────────
export const getDisplayName = (name, email) => {
  if (name && name !== email) return name;
  return email?.split('@')[0] || '?';
};

// ── Mime type label ───────────────────────────────────────────
export const getMimeLabel = (mimeType) => {
  const map = {
    'application/vnd.google-apps.folder': 'Folder',
    'application/vnd.google-apps.document': 'Google Doc',
    'application/vnd.google-apps.spreadsheet': 'Google Sheet',
    'application/vnd.google-apps.presentation': 'Google Slides',
    'application/vnd.google-apps.video': 'Video',
    'application/vnd.google-apps.audio': 'Audio',
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'video/mp4': 'MP4 Video',
    'audio/mpeg': 'MP3 Audio',
    'application/zip': 'ZIP Archive',
    'text/plain': 'Text File',
    'application/json': 'JSON File',
  };
  return map[mimeType] || mimeType?.split('/').pop()?.toUpperCase() || 'File';
};
