/**
 * unified/providers.js
 *
 * Provider adapters for Unified Storage. The engine only talks to this interface:
 *
 *   getCapacity(account)                         → { limit: number|null, used }
 *   findObjects(account, name)                   → [{ objectId, size, checksum }]
 *   uploadObject(account, name, blob, hashes, signal) → { objectId, size, checksum }
 *   verifyObject(account, objectId, chunk)       → 'verified' | 'mismatch' | 'missing' | 'unknown'
 *   downloadObject(account, objectId, signal)    → ArrayBuffer
 *   deleteObject(account, objectId)              → void (already-absent counts as success)
 *
 * `account` is { email, accessToken } from the existing OAuth flows (no new auth here).
 * Every failure is a UnifiedError so the engine never branches on provider details.
 * These call the REST APIs directly (rather than api/*.js) because the engine needs HTTP
 * status + provider error reasons to classify quota / rate-limit / not-found correctly.
 */

import { UnifiedError, ERR, kindForStatus, toUnifiedError } from './core.js';

const DRIVE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const DBX_API = 'https://api.dropboxapi.com/2';
const DBX_CONTENT = 'https://content.dropboxapi.com/2';
export const STORAGE_FOLDER = 'DriveUnify Unified Storage';

const retryAfter = (res) => {
  const s = Number(res.headers?.get?.('Retry-After'));
  return Number.isFinite(s) && s > 0 ? s * 1000 : undefined;
};

const doFetch = async (url, init) => {
  try {
    return await fetch(url, init);
  } catch (err) {
    throw toUnifiedError(err);
  }
};

// ── Google Drive ──────────────────────────────────────────────

const driveError = async (res) => {
  const body = await res.json().catch(() => ({}));
  const reason = body?.error?.errors?.[0]?.reason || '';
  const message = body?.error?.message || `Google Drive HTTP ${res.status}`;
  let kind = kindForStatus(res.status);
  if (reason === 'storageQuotaExceeded' || reason === 'quotaExceeded') kind = ERR.QUOTA;
  else if (/rateLimitExceeded/i.test(reason)) kind = ERR.RATE_LIMIT;
  return new UnifiedError(kind, message, { status: res.status, retryAfterMs: retryAfter(res) });
};

const driveFetch = async (account, url, init = {}) => {
  const res = await doFetch(url, { ...init, headers: { Authorization: `Bearer ${account.accessToken}`, ...init.headers } });
  if (!res.ok) throw await driveError(res);
  return res;
};

const driveFolderCache = new Map();

const driveFolder = async (account) => {
  if (driveFolderCache.has(account.email)) return driveFolderCache.get(account.email);
  const q = `mimeType='application/vnd.google-apps.folder' and trashed=false and appProperties has { key='driveunify' and value='unified-root' }`;
  const list = await (await driveFetch(account, `${DRIVE}/files?q=${encodeURIComponent(q)}&fields=files(id)&spaces=drive`)).json();
  let id = list.files?.[0]?.id;
  if (!id) {
    const created = await (await driveFetch(account, `${DRIVE}/files?fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: STORAGE_FOLDER,
        mimeType: 'application/vnd.google-apps.folder',
        appProperties: { driveunify: 'unified-root' },
        description: 'Chunks of files stored with DriveUnify Unified Storage. Deleting these breaks those files.',
      }),
    })).json();
    id = created.id;
  }
  driveFolderCache.set(account.email, id);
  return id;
};

const FILE_FIELDS = 'id,size,sha256Checksum,trashed';
const driveObj = (f) => ({ objectId: f.id, size: Number(f.size), checksum: f.sha256Checksum || null });

export const googleDriveAdapter = {
  provider: 'google_drive',

  async getCapacity(account) {
    const { storageQuota: q = {} } = await (await driveFetch(account, `${DRIVE}/about?fields=storageQuota`)).json();
    // Drive omits `limit` for unlimited storage.
    return { limit: q.limit == null ? null : Number(q.limit), used: Number(q.usage || 0) };
  },

  async findObjects(account, name) {
    const q = `trashed=false and appProperties has { key='duName' and value='${name}' }`;
    const res = await driveFetch(account, `${DRIVE}/files?q=${encodeURIComponent(q)}&fields=files(${FILE_FIELDS})&spaces=drive`);
    return ((await res.json()).files || []).map(driveObj);
  },

  async uploadObject(account, name, blob, _hashes, signal) {
    const parent = await driveFolder(account);
    const init = await driveFetch(account, `${DRIVE_UPLOAD}/files?uploadType=resumable&fields=${FILE_FIELDS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'application/octet-stream',
        'X-Upload-Content-Length': String(blob.size),
      },
      body: JSON.stringify({ name, parents: [parent], mimeType: 'application/octet-stream', appProperties: { duName: name } }),
      signal,
    });
    const sessionUrl = init.headers.get('Location');
    if (!sessionUrl) throw new UnifiedError(ERR.REJECTED, 'Drive did not return an upload session.');
    // shortcut: one PUT per 64 MiB chunk; an interrupted PUT restarts that chunk instead of resuming mid-chunk
    // via the session URI. Upgrade by persisting the URI if chunks grow much larger.
    const res = await doFetch(sessionUrl, {
      method: 'PUT',
      headers: { 'Content-Range': blob.size ? `bytes 0-${blob.size - 1}/${blob.size}` : 'bytes */0' },
      body: blob,
      signal,
    });
    if (!res.ok) throw await driveError(res);
    return driveObj(await res.json());
  },

  async verifyObject(account, objectId, chunk) {
    let f;
    try {
      f = await (await driveFetch(account, `${DRIVE}/files/${encodeURIComponent(objectId)}?fields=${FILE_FIELDS}`)).json();
    } catch (err) {
      if (err.kind === ERR.NOT_FOUND) return 'missing';
      throw err;
    }
    if (f.trashed) return 'missing';
    if (Number(f.size) !== chunk.length) return 'mismatch';
    if (!f.sha256Checksum) return 'unknown'; // not always populated right after upload
    return f.sha256Checksum === chunk.sha256 ? 'verified' : 'mismatch';
  },

  async downloadObject(account, objectId, signal) {
    const res = await driveFetch(account, `${DRIVE}/files/${encodeURIComponent(objectId)}?alt=media`, { signal });
    return res.arrayBuffer();
  },

  async deleteObject(account, objectId) {
    try {
      // Permanent delete: these are DriveUnify-owned parts identified by exact ID, not by name.
      await driveFetch(account, `${DRIVE}/files/${encodeURIComponent(objectId)}`, { method: 'DELETE' });
    } catch (err) {
      if (err.kind !== ERR.NOT_FOUND) throw err;
    }
  },
};

// ── Dropbox ───────────────────────────────────────────────────

const dropboxError = async (res) => {
  const text = await res.text().catch(() => '');
  let summary = text;
  try { summary = JSON.parse(text).error_summary || text; } catch { /* not JSON */ }
  let kind = kindForStatus(res.status);
  if (res.status === 409) {
    if (/insufficient_space/.test(summary)) kind = ERR.QUOTA;
    else if (/not_found/.test(summary)) kind = ERR.NOT_FOUND;
    else if (/too_many_write_operations/.test(summary)) kind = ERR.RATE_LIMIT;
    else if (/content_hash_mismatch/.test(summary)) kind = ERR.CHECKSUM;
    else kind = ERR.REJECTED;
  }
  return new UnifiedError(kind, summary || `Dropbox HTTP ${res.status}`, { status: res.status, retryAfterMs: retryAfter(res) });
};

const dbxRpc = async (account, endpoint, body) => {
  const res = await doFetch(`${DBX_API}${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${account.accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) throw await dropboxError(res);
  return res.json();
};

const dbxPath = (name) => `/${STORAGE_FOLDER}/${name}`;
const dbxObj = (m) => ({ objectId: m.id, size: Number(m.size), checksum: m.content_hash || null });

export const dropboxAdapter = {
  provider: 'dropbox',

  async getCapacity(account) {
    const data = await dbxRpc(account, '/users/get_space_usage', null);
    return { limit: Number(data?.allocation?.allocated || 0), used: Number(data?.used || 0) };
  },

  async findObjects(account, name) {
    try {
      const m = await dbxRpc(account, '/files/get_metadata', { path: dbxPath(name) });
      return m['.tag'] === 'file' ? [dbxObj(m)] : [];
    } catch (err) {
      if (err.kind === ERR.NOT_FOUND) return [];
      throw err;
    }
  },

  async uploadObject(account, name, blob, hashes, signal) {
    // Single /files/upload (≤150 MiB). Overwrite on a deterministic path makes retries idempotent,
    // and content_hash makes Dropbox reject bytes that differ from what we hashed.
    const res = await doFetch(`${DBX_CONTENT}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: dbxPath(name), mode: 'overwrite', autorename: false, mute: true, content_hash: hashes.contentHash,
        }),
      },
      body: blob,
      signal,
    });
    if (!res.ok) throw await dropboxError(res);
    return dbxObj(await res.json());
  },

  async verifyObject(account, objectId, chunk) {
    let m;
    try {
      m = await dbxRpc(account, '/files/get_metadata', { path: objectId });
    } catch (err) {
      if (err.kind === ERR.NOT_FOUND) return 'missing';
      throw err;
    }
    if (Number(m.size) !== chunk.length) return 'mismatch';
    if (!m.content_hash) return 'unknown';
    return m.content_hash === chunk.contentHash ? 'verified' : 'mismatch';
  },

  async downloadObject(account, objectId, signal) {
    const res = await doFetch(`${DBX_CONTENT}/files/download`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${account.accessToken}`, 'Dropbox-API-Arg': JSON.stringify({ path: objectId }) },
      signal,
    });
    if (!res.ok) throw await dropboxError(res);
    return res.arrayBuffer();
  },

  async deleteObject(account, objectId) {
    try {
      await dbxRpc(account, '/files/delete_v2', { path: objectId });
    } catch (err) {
      if (err.kind !== ERR.NOT_FOUND) throw err;
    }
  },
};

export const ADAPTERS = { google_drive: googleDriveAdapter, dropbox: dropboxAdapter };

export const providerOf = (account) =>
  (account?.provider || '').toLowerCase().includes('dropbox') ? 'dropbox' : 'google_drive';
