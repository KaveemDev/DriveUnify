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
