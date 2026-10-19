/**
 * dropboxApi.js
 *
 * REST client for Dropbox API v2:
 *  - Authentication & Account (/2/users)
 *  - Files & Folders listing, creation, rename, delete (/2/files)
 *  - Content download with HTTP Range support for bounded streaming (/2/files/download)
 *  - Resumable chunked upload sessions (/2/files/upload_session/*)
 */

import { getMimeTypeCategory } from '../config/constants.js';

export const DROPBOX_API_BASE = 'https://api.dropboxapi.com/2';
export const DROPBOX_CONTENT_BASE = 'https://content.dropboxapi.com/2';

// ── Extension to MIME Mapping ──────────────────────────────────
const EXT_TO_MIME = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  html: 'text/html',
  js: 'text/javascript',
};

export const getMimeTypeFromFilename = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return EXT_TO_MIME[ext] || 'application/octet-stream';
};

/**
 * Resolve folder ID or path and filename to a valid absolute Dropbox path.
 * Dropbox paths must start with a leading slash: e.g. "/Folder/file.txt"
 */
export const resolveDropboxPath = (folderIdOrPath, fileName) => {
  if (!folderIdOrPath || folderIdOrPath === 'root' || folderIdOrPath === '/') {
    return `/${fileName}`;
  }
  const cleanFolder = folderIdOrPath.startsWith('/') ? folderIdOrPath : `/${folderIdOrPath}`;
  return `${cleanFolder.replace(/\/+$/, '')}/${fileName}`;
};

/**
 * Normalize a Dropbox metadata entry to DriveUnify's unified file model.
 */
export const normalizeDropboxFile = (entry, accountEmail) => {
  const isFolder = entry['.tag'] === 'folder';
  const mimeType = isFolder ? 'application/vnd.google-apps.folder' : getMimeTypeFromFilename(entry.name);

  // Extract parent folder path from path_lower
  const pathParts = (entry.path_display || entry.path_lower || '').split('/').filter(Boolean);
  pathParts.pop();
  const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : 'root';

  return {
    id: entry.id || entry.path_lower,
    name: entry.name,
    pathDisplay: entry.path_display,
    pathLower: entry.path_lower,
    mimeType,
    category: isFolder ? 'folder' : getMimeTypeCategory(mimeType),
    size: isFolder ? 0 : (entry.size || 0),
    modifiedTime: entry.server_modified || entry.client_modified || new Date().toISOString(),
    createdTime: entry.client_modified || entry.server_modified || new Date().toISOString(),
    provider: 'dropbox',
    accountEmail,
    parents: [parentPath],
    isFolder,
    shared: false,
    starred: false,
    trashed: false,
    capabilities: {
      canEdit: true,
      canDelete: true,
      canShare: true,
      canDownload: !isFolder,
    },
    webViewLink: `https://www.dropbox.com/home${entry.path_display ? encodeURI(entry.path_display) : ''}`,
    webContentLink: null,
  };
};

/**
 * Generic Dropbox RPC POST helper with error parsing.
 */
async function dropboxRpc(endpoint, accessToken, body = null, signal = null) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  let requestBody = null;
  if (body !== null && body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(`${DROPBOX_API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: requestBody,
    signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMsg = `Dropbox API error: HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(errorText);
      errorMsg = parsed?.error_summary || parsed?.error?.['.tag'] || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json().catch(() => ({}));
}

// ── Account & Space ───────────────────────────────────────────

export const getCurrentDropboxAccount = async (accessToken, signal = null) => {
  return dropboxRpc('/users/get_current_account', accessToken, null, signal);
};

export const getDropboxSpaceUsage = async (accessToken, signal = null) => {
  const data = await dropboxRpc('/users/get_space_usage', accessToken, null, signal);
  const used = data?.used || 0;
  let limit = 0;

  if (data?.allocation?.['.tag'] === 'individual') {
    limit = data.allocation.allocated || 0;
  } else if (data?.allocation?.['.tag'] === 'team') {
    limit = data.allocation.allocated || 0;
  }

  return {
    used,
    limit,
    usedPercent: limit > 0 ? Math.round((used / limit) * 100) : 0,
    allocationType: data?.allocation?.['.tag'] || 'individual',
  };
};

// ── List Files & Folders ──────────────────────────────────────

export const listDropboxFiles = async (accessToken, path = '', options = {}) => {
  const folderPath = path === 'root' || !path ? '' : (path.startsWith('/') ? path : `/${path}`);
  const allEntries = [];

  const initialRes = await dropboxRpc('/files/list_folder', accessToken, {
    path: folderPath,
    recursive: options.recursive || false,
    include_media_info: true,
    include_deleted: false,
    limit: options.limit || 200,
  });

  if (initialRes?.entries) {
    allEntries.push(...initialRes.entries);
  }

  let cursor = initialRes?.has_more ? initialRes.cursor : null;
  while (cursor) {
    const continueRes = await dropboxRpc('/files/list_folder_continue', accessToken, { cursor });
    if (continueRes?.entries) {
      allEntries.push(...continueRes.entries);
    }
    cursor = continueRes?.has_more ? continueRes.cursor : null;
  }

  return allEntries;
};

export const listDropboxFolders = async (accessToken, path = '') => {
  const entries = await listDropboxFiles(accessToken, path, { recursive: false });
  return entries
    .filter((e) => e['.tag'] === 'folder')
    .map((f) => ({
      id: f.path_display || f.path_lower,
      name: f.name,
      pathDisplay: f.path_display,
      pathLower: f.path_lower,
    }));
};

// ── Bounded Streaming & Chunked Transfer API ─────────────────

/**
 * Download a bounded byte range of a Dropbox file via HTTP Range request.
 * Strictly loads only the requested chunk [start, end] into memory.
 */
export const downloadDropboxFileRange = async (accessToken, pathOrId, start, end, signal = null) => {
  const res = await fetch(`${DROPBOX_CONTENT_BASE}/files/download`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ path: pathOrId }),
      Range: `bytes=${start}-${end}`,
    },
    signal,
  });

  if (!res.ok && res.status !== 206) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Dropbox range download failed: HTTP ${res.status} ${errText}`);
  }

  return res.blob();
};

/**
 * Get a temporary direct download/streaming link for a file (valid for 4 hours).
 */
export const getDropboxTemporaryLink = async (accessToken, pathOrId, signal = null) => {
  const res = await dropboxRpc('/files/get_temporary_link', accessToken, { path: pathOrId }, signal);
  return res?.link || null;
};

/**
 * Direct upload for single files / small files (< 150 MiB).
 */
export const uploadDropboxFileDirect = async (accessToken, blob, targetPath, signal = null) => {
  const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const res = await fetch(`${DROPBOX_CONTENT_BASE}/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({
        path: cleanPath,
        mode: 'add',
        autorename: true,
        mute: false,
        strict_conflict: false,
      }),
      'Content-Type': 'application/octet-stream',
    },
    body: blob,
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Dropbox direct upload failed: HTTP ${res.status} ${errText}`);
  }

  return res.json();
};

/**
 * Start a chunked upload session on Dropbox.
 * Accepts the first chunk and returns session_id.
 */
export const initiateDropboxUploadSession = async (accessToken, firstChunkBlob = new Blob([]), signal = null) => {
  const res = await fetch(`${DROPBOX_CONTENT_BASE}/files/upload_session/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({ close: false }),
      'Content-Type': 'application/octet-stream',
    },
    body: firstChunkBlob,
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to initiate Dropbox upload session: HTTP ${res.status} ${errText}`);
  }

  const data = await res.json();
  if (!data?.session_id) {
    throw new Error('Dropbox upload session started but no session_id returned');
  }
  return data.session_id;
};

/**
 * Append a chunk to an active Dropbox upload session.
 */
export const appendDropboxUploadChunk = async (accessToken, sessionId, chunkBlob, offset, signal = null) => {
  const res = await fetch(`${DROPBOX_CONTENT_BASE}/files/upload_session/append_v2`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({
        cursor: {
          session_id: sessionId,
          offset,
        },
        close: false,
      }),
      'Content-Type': 'application/octet-stream',
    },
    body: chunkBlob,
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Dropbox chunk append failed at offset ${offset}: HTTP ${res.status} ${errText}`);
  }

  return true;
};

/**
 * Finish a chunked Dropbox upload session and commit the file to disk.
 */
export const finishDropboxUploadSession = async (
  accessToken,
  sessionId,
  finalChunkBlob,
  offset,
  targetPath,
  signal = null
) => {
  const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const res = await fetch(`${DROPBOX_CONTENT_BASE}/files/upload_session/finish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({
        cursor: {
          session_id: sessionId,
          offset,
        },
        commit: {
          path: cleanPath,
          mode: 'add',
          autorename: true,
          mute: false,
          strict_conflict: false,
        },
      }),
      'Content-Type': 'application/octet-stream',
    },
    body: finalChunkBlob || new Blob([]),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Dropbox upload finish failed: HTTP ${res.status} ${errText}`);
  }

  return res.json();
};

// ── File Management: Folder Create, Delete, Move ──────────────

export const createDropboxFolder = async (accessToken, path, signal = null) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const data = await dropboxRpc('/files/create_folder_v2', accessToken, { path: cleanPath, autorename: false }, signal);
  return data?.metadata || data;
};

export const deleteDropboxItem = async (accessToken, pathOrId, signal = null) => {
  const data = await dropboxRpc('/files/delete_v2', accessToken, { path: pathOrId }, signal);
  return data?.metadata || data;
};

export const renameDropboxItem = async (accessToken, fromPathOrId, toPath, signal = null) => {
  const cleanToPath = toPath.startsWith('/') ? toPath : `/${toPath}`;
  const data = await dropboxRpc(
    '/files/move_v2',
    accessToken,
    {
      from_path: fromPathOrId,
      to_path: cleanToPath,
      autorename: true,
    },
    signal
  );
  return data?.metadata || data;
};
