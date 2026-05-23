import { DRIVE_API_BASE, DEFAULT_FILE_FIELDS, ITEMS_PER_PAGE } from '../config/constants';

// ── In-memory rate limiter (10 req/s per account) ────────────
const rateLimiters = {};

const getRateLimiter = (accountEmail) => {
  if (!rateLimiters[accountEmail]) {
    rateLimiters[accountEmail] = { queue: [], processing: false, requestCount: 0, windowStart: Date.now() };
  }
  return rateLimiters[accountEmail];
};

const withRateLimit = (accountEmail, fn) => {
  const limiter = getRateLimiter(accountEmail);
  return new Promise((resolve, reject) => {
    limiter.queue.push({ fn, resolve, reject });
    processQueue(limiter);
  });
};

const processQueue = async (limiter) => {
  if (limiter.processing) return;
  limiter.processing = true;

  while (limiter.queue.length > 0) {
    const now = Date.now();
    if (now - limiter.windowStart >= 1000) {
      limiter.requestCount = 0;
      limiter.windowStart = now;
    }

    if (limiter.requestCount >= 10) {
      const waitMs = 1000 - (now - limiter.windowStart);
      await sleep(waitMs);
      limiter.requestCount = 0;
      limiter.windowStart = Date.now();
    }

    const { fn, resolve, reject } = limiter.queue.shift();
    limiter.requestCount++;
    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  }

  limiter.processing = false;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Standardized Error ────────────────────────────────────────

const createApiError = (code, message, retryable = false) => {
  const err = new Error(message);
  err.code = code;
  err.retryable = retryable;
  return err;
};

// ── Core Fetch with Retry ─────────────────────────────────────

const driveRequest = async (accessToken, url, options = {}, retries = 3) => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers });

      if (res.status === 401) {
        const event = new CustomEvent('driveTokenExpired', { detail: { url } });
        window.dispatchEvent(event);
        throw createApiError(401, 'Access token expired', false);
      }

      if (res.status === 429) {
        const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        if (attempt < retries) { await sleep(backoff); continue; }
        throw createApiError(429, 'Rate limit exceeded', true);
      }

      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        throw createApiError(403, body?.error?.message || 'Permission denied', false);
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error?.message || `HTTP ${res.status}`;
        throw createApiError(res.status, msg, res.status >= 500);
      }

      if (res.status === 204) return null;
      return res.json();
    } catch (err) {
      if (attempt === retries || !err.retryable) throw err;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
};

// ── API Functions ─────────────────────────────────────────────

export const listFiles = (accessToken, {
  folderId = 'root',
  pageToken = null,
  pageSize = ITEMS_PER_PAGE,
  orderBy = 'folder,name',
  query = null,
} = {}, accountEmail = 'default') => {
  return withRateLimit(accountEmail, async () => {
    const q = [
      folderId && `'${folderId}' in parents`,
      `trashed = false`,
      query,
    ].filter(Boolean).join(' and ');

    const params = new URLSearchParams({
      q,
      fields: `nextPageToken,files(${DEFAULT_FILE_FIELDS})`,
      pageSize: String(pageSize),
      orderBy,
      ...(pageToken && { pageToken }),
    });

    return driveRequest(accessToken, `${DRIVE_API_BASE}/files?${params}`);
  });
};

/**
 * List only subfolders of a given folder.
 * Used by the destination folder picker in TransferModal.
 */
export const listFoldersInFolder = (accessToken, folderId = 'root', accountEmail = 'default') => {
  return withRateLimit(accountEmail, () => {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      orderBy: 'name',
      pageSize: '200',
    });
    return driveRequest(accessToken, `${DRIVE_API_BASE}/files?${params}`);
  });
};

/**
 * List ALL items (files + folders) inside a folder, handling pagination.
 * Each page is independently rate-limited. Used for recursive folder copy.
 */
export const listFolderContents = async (accessToken, folderId, accountEmail = 'default') => {
  const allItems = [];
  let pageToken = null;
  do {
    const result = await withRateLimit(accountEmail, () => {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'nextPageToken,files(id,name,mimeType,size)',
        pageSize: '200',
        ...(pageToken && { pageToken }),
      });
      return driveRequest(accessToken, `${DRIVE_API_BASE}/files?${params}`);
    });
    if (result?.files) allItems.push(...result.files);
    pageToken = result?.nextPageToken || null;
  } while (pageToken);
  return allItems;
};


export const getFile = (accessToken, fileId, accountEmail = 'default') => {
  return withRateLimit(accountEmail, () =>
    driveRequest(accessToken, `${DRIVE_API_BASE}/files/${fileId}?fields=${DEFAULT_FILE_FIELDS}`)
  );
};

export const searchFiles = (accessToken, query, accountEmail = 'default') => {
  return withRateLimit(accountEmail, async () => {
    const q = `name contains '${query.replace(/'/g, "\\'")}' and trashed = false`;
    const params = new URLSearchParams({
      q,
      fields: `nextPageToken,files(${DEFAULT_FILE_FIELDS})`,
      pageSize: '50',
    });
    return driveRequest(accessToken, `${DRIVE_API_BASE}/files?${params}`);
  });
};

export const getStorageQuota = (accessToken, accountEmail = 'default') => {
  return withRateLimit(accountEmail, () =>
    driveRequest(accessToken, `${DRIVE_API_BASE}/about?fields=storageQuota,user`)
  );
};

export const createFolder = (accessToken, name, parentId = 'root', accountEmail = 'default') => {
  return withRateLimit(accountEmail, () =>
    driveRequest(accessToken, `${DRIVE_API_BASE}/files`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    })
  );
};

export const deleteFile = (accessToken, fileId, accountEmail = 'default') => {
  return withRateLimit(accountEmail, () =>
    driveRequest(accessToken, `${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify({ trashed: true }),
    })
  );
};

export const permanentlyDeleteFile = (accessToken, fileId, accountEmail = 'default') => {
  return withRateLimit(accountEmail, () =>
    driveRequest(accessToken, `${DRIVE_API_BASE}/files/${fileId}`, { method: 'DELETE' })
  );
};

export const renameFile = (accessToken, fileId, newName, accountEmail = 'default') => {
  return withRateLimit(accountEmail, () =>
    driveRequest(accessToken, `${DRIVE_API_BASE}/files/${fileId}?fields=${DEFAULT_FILE_FIELDS}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName }),
    })
  );
};

export const starFile = (accessToken, fileId, starred, accountEmail = 'default') => {
  return withRateLimit(accountEmail, () =>
    driveRequest(accessToken, `${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify({ starred }),
    })
  );
};

export const getDownloadUrl = (fileId) =>
  `${DRIVE_API_BASE}/files/${fileId}?alt=media`;

export const getThumbnailUrl = (file) =>
  file.thumbnailLink || file.iconLink || null;

// ── Cross-Drive Transfer API ──────────────────────────────────

/**
 * Grant a user permission on a file (used for temporary share trick).
 * Returns the created permission ID.
 */
export const addPermission = (accessToken, fileId, emailAddress, role = 'reader', accountEmail = 'default') => {
  return withRateLimit(accountEmail, () =>
    driveRequest(accessToken, `${DRIVE_API_BASE}/files/${fileId}/permissions?sendNotificationEmail=false&supportsAllDrives=true`, {
      method: 'POST',
      body: JSON.stringify({ type: 'user', role, emailAddress }),
    })
  );
};

/**
 * Remove a specific permission from a file (cleanup after temp share).
 */
export const deletePermission = (accessToken, fileId, permissionId, accountEmail = 'default') => {
  return withRateLimit(accountEmail, () =>
    driveRequest(accessToken, `${DRIVE_API_BASE}/files/${fileId}/permissions/${permissionId}?supportsAllDrives=true`, {
      method: 'DELETE',
    })
  );
};

/**
 * Server-side copy of a file using Drive files.copy API.
 * The destAccessToken must belong to an account that has read access to fileId.
 * Google copies the file on their servers — no bytes touch the browser.
 */
export const copyFileToDrive = (destAccessToken, fileId, destFileName, destParentId = 'root', accountEmail = 'default') => {
  return withRateLimit(accountEmail, () =>
    driveRequest(destAccessToken, `${DRIVE_API_BASE}/files/${fileId}/copy?supportsAllDrives=true`, {
      method: 'POST',
      body: JSON.stringify({
        name: destFileName,
        parents: [destParentId],
      }),
    })
  );
};

/**
 * Download a file as a Blob using the source account's token.
 * Used for binary files (the blob stays in browser RAM, never touches disk).
 */
export const downloadFileBlob = async (accessToken, fileId, accountEmail = 'default') => {
  return withRateLimit(accountEmail, async () => {
    const res = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}?alt=media&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message || `Download failed: HTTP ${res.status}`);
    }
    return res.blob();
  });
};

/**
 * Upload a Blob to Drive using multipart upload (metadata + file in one request).
 * Used for binary files after downloading via downloadFileBlob.
 */
export const uploadMultipartToDrive = async (destAccessToken, blob, fileName, mimeType, destParentId = 'root', onProgress, accountEmail = 'default') => {
  return withRateLimit(accountEmail, () => new Promise((resolve, reject) => {
    const metadata = JSON.stringify({ name: fileName, parents: [destParentId] });
    const boundary = `boundary_${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const reader = new FileReader();
    reader.onload = async () => {
      const body = [
        delimiter,
        `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
        metadata,
        delimiter,
        `Content-Type: ${mimeType}\r\n\r\n`,
      ];

      // Build the multipart body as a Blob to preserve binary data
      const bodyBlob = new Blob([
        delimiter,
        `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
        metadata,
        delimiter,
        `Content-Type: ${mimeType}\r\n\r\n`,
        blob,
        closeDelimiter,
      ]);

      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&supportsAllDrives=true`);
      xhr.setRequestHeader('Authorization', `Bearer ${destAccessToken}`);
      xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve({}); }
        } else {
          let msg = `Upload failed: HTTP ${xhr.status}`;
          try { msg = JSON.parse(xhr.responseText)?.error?.message || msg; } catch { /* ignore */ }
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(bodyBlob);
    };
    reader.onerror = () => reject(new Error('Failed to read file blob'));
    reader.readAsArrayBuffer(blob); // just to trigger, we actually use blob directly
  }));
};
