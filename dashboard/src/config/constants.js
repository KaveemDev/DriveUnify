// Google Drive API Scopes
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

// File MIME type categories
export const FILE_MIME_TYPES = {
  folder: ['application/vnd.google-apps.folder'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'],
  video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg', 'application/vnd.google-apps.video'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'application/vnd.google-apps.audio'],
  pdf: ['application/pdf'],
  doc: [
    'application/vnd.google-apps.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  sheet: [
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
  slide: [
    'application/vnd.google-apps.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  code: [
    'text/javascript', 'text/typescript', 'text/html', 'text/css', 'application/json',
    'text/xml', 'application/xml', 'text/x-python', 'text/x-java-source', 'text/x-c',
    'text/x-c++', 'text/x-ruby', 'text/x-go', 'text/x-rust', 'text/plain',
  ],
  archive: [
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    'application/x-tar', 'application/gzip', 'application/x-bzip2',
  ],
};

export const getMimeTypeCategory = (mimeType) => {
  for (const [category, types] of Object.entries(FILE_MIME_TYPES)) {
    if (types.includes(mimeType)) return category;
  }
  return 'other';
};

// Upload limits
export const UPLOAD_MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB in bytes
export const MULTIPART_UPLOAD_THRESHOLD = 5 * 1024 * 1024; // 5MB

// Pagination
export const ITEMS_PER_PAGE = 50;

// View modes
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
};

// Sort options
export const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'modifiedTime', label: 'Date Modified' },
  { value: 'size', label: 'Size' },
  { value: 'mimeType', label: 'Type' },
];

// Google Drive API base URL
export const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
export const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

// Default file fields to fetch from Drive API
export const DEFAULT_FILE_FIELDS =
  'id,name,mimeType,size,modifiedTime,createdTime,parents,iconLink,thumbnailLink,shared,starred,trashed,capabilities,owners,webViewLink,webContentLink';

// Account colors for avatars
export const ACCOUNT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
];

export const getAccountColor = (email) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ACCOUNT_COLORS[Math.abs(hash) % ACCOUNT_COLORS.length];
};
