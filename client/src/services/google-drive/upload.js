import { DRIVE_UPLOAD_BASE, MULTIPART_UPLOAD_THRESHOLD } from '../../config/constants';
import { getMimeTypeCategory } from '../../config/constants';

const normalizeUploadedFile = (file, accountEmail) => ({
  id: file.id,
  name: file.name,
  mimeType: file.mimeType,
  category: getMimeTypeCategory(file.mimeType),
  size: file.size ? parseInt(file.size, 10) : 0,
  modifiedTime: file.modifiedTime,
  createdTime: file.createdTime,
  provider: 'google_drive',
  accountEmail,
  parents: file.parents || [],
  iconLink: file.iconLink,
  thumbnailLink: file.thumbnailLink,
  shared: false,
  starred: false,
  trashed: false,
  webViewLink: file.webViewLink,
  webContentLink: file.webContentLink,
});

// ── Multipart Upload (< 5MB) ──────────────────────────────────

const multipartUpload = async (accessToken, file, folderId, onProgress, signal) => {
  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    ...(folderId && { parents: [folderId] }),
  };

  const boundary = '-------314159265358979323846';
  const metaPart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) + `\r\n`;
  const dataPart = `--${boundary}\r\nContent-Type: ${metadata.mimeType}\r\n\r\n`;
  const closePart = `\r\n--${boundary}--`;

  const fileData = await file.arrayBuffer();
  const blob = new Blob([metaPart, dataPart, fileData, closePart]);

  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    signal?.addEventListener('abort', () => xhr.abort());

    xhr.open('POST', `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,parents,iconLink,thumbnailLink,webViewLink,webContentLink,createdTime`);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', `multipart/related; boundary="${boundary}"`);
    xhr.send(blob);
  });
};

// ── Resumable Upload (>= 5MB) ─────────────────────────────────

const resumableUpload = async (accessToken, file, folderId, onProgress, signal) => {
  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    ...(folderId && { parents: [folderId] }),
  };

  // Step 1: Initiate resumable upload
  const initRes = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=resumable&fields=id,name,mimeType,size,modifiedTime,parents,iconLink,thumbnailLink,webViewLink,webContentLink,createdTime`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': metadata.mimeType,
        'X-Upload-Content-Length': String(file.size),
      },
      body: JSON.stringify(metadata),
      signal,
    }
  );

  if (!initRes.ok) {
    throw new Error(`Failed to initiate resumable upload: ${initRes.status}`);
  }

  const uploadUrl = initRes.headers.get('Location');

  // Step 2: Upload in chunks
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  let offset = 0;

  while (offset < file.size) {
    if (signal?.aborted) throw new Error('Upload cancelled');

    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const end = Math.min(offset + CHUNK_SIZE, file.size) - 1;

    const chunkRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': String(chunk.size),
        'Content-Range': `bytes ${offset}-${end}/${file.size}`,
      },
      body: chunk,
      signal,
    });

    if (chunkRes.status === 200 || chunkRes.status === 201) {
      onProgress(100);
      return chunkRes.json();
    }

    if (chunkRes.status === 308) {
      const range = chunkRes.headers.get('Range');
      if (range) {
        offset = parseInt(range.split('-')[1], 10) + 1;
      } else {
        offset += chunk.size;
      }
      onProgress(Math.round((offset / file.size) * 100));
    } else {
      throw new Error(`Chunk upload failed: ${chunkRes.status}`);
    }
  }

  throw new Error('Resumable upload ended unexpectedly');
};

// ── Main Upload Function ──────────────────────────────────────

export const uploadFile = async (accessToken, file, {
  folderId = null,
  onProgress = () => {},
  accountEmail = '',
  signal = null,
} = {}) => {
  let raw;

  if (file.size < MULTIPART_UPLOAD_THRESHOLD) {
    raw = await multipartUpload(accessToken, file, folderId, onProgress, signal);
  } else {
    raw = await resumableUpload(accessToken, file, folderId, onProgress, signal);
  }

  return normalizeUploadedFile(raw, accountEmail);
};
