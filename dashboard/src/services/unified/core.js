/**
 * unified/core.js
 *
 * Pure building blocks of Unified Storage (no Firebase, no network):
 *   - chunk layout, SHA-256 helpers, error model + retry, state machines, capacity planner.
 * Everything here runs in the browser and in `node --test`.
 */

// ── Chunk layout ──────────────────────────────────────────────

export const LAYOUT_VERSION = 1;
// 64 MiB logical chunks: fits Dropbox single /files/upload (150 MiB cap) and one Drive resumable PUT.
export const DEFAULT_CHUNK_SIZE = 64 * 1024 * 1024;
export const UPLOAD_CONCURRENCY = 2; // ~2 × 64 MiB peak buffer on older laptops
export const DOWNLOAD_CONCURRENCY = 2;
export const DROPBOX_BLOCK_SIZE = 4 * 1024 * 1024;

export const chunkId = (index) => `c${String(index).padStart(6, '0')}`;

/** Stable layout: offsets/lengths derive only from (size, chunkSize). */
export const planChunks = (size, chunkSize = DEFAULT_CHUNK_SIZE) => {
  if (!Number.isSafeInteger(size) || size < 0) throw new Error('Invalid file size');
  if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0) throw new Error('Invalid chunk size');
  const count = Math.ceil(size / chunkSize);
  return Array.from({ length: count }, (_, index) => {
    const offset = index * chunkSize;
    return { id: chunkId(index), index, offset, length: Math.min(chunkSize, size - offset) };
  });
};

/** Provider object name: deterministic per (file, chunk, generation) so retries reconcile instead of duplicating. */
export const objectName = (fileId, index, generation = 0) =>
  `${fileId}.${String(index).padStart(6, '0')}${generation ? `.r${generation}` : ''}.part`;

// ── Hashing (SHA-256 per chunk; chunk-sized buffers only) ────

const subtle = () => globalThis.crypto.subtle;
const toHex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => Uint8Array.from(hex.match(/../g) || [], (h) => parseInt(h, 16));

export const sha256Hex = async (bytes) => toHex(await subtle().digest('SHA-256', bytes));

/** Dropbox content_hash: SHA-256 over the concatenated SHA-256 of each 4 MiB block. */
export const dropboxContentHash = async (bytes) => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const parts = [];
  for (let o = 0; o < view.length; o += DROPBOX_BLOCK_SIZE) {
    parts.push(new Uint8Array(await subtle().digest('SHA-256', view.subarray(o, o + DROPBOX_BLOCK_SIZE))));
  }
  const all = new Uint8Array(parts.length * 32);
  parts.forEach((p, i) => all.set(p, i * 32));
  return sha256Hex(all);
};

/**
 * Whole-file checksum = SHA-256 over the ordered chunk SHA-256 digests (hash list).
 * NOTE: not equal to `sha256sum file`; a streaming whole-file SHA-256 needs an incremental
 * hasher that Web Crypto does not offer. Combined with per-chunk checks it detects
 * any changed, missing or reordered chunk.
 */
export const manifestHash = async (chunkHexes) => {
  const all = new Uint8Array(chunkHexes.length * 32);
  chunkHexes.forEach((h, i) => all.set(fromHex(h), i * 32));
  return sha256Hex(all);
};

export const hashChunk = async (bytes) => ({
  sha256: await sha256Hex(bytes),
  contentHash: await dropboxContentHash(bytes),
});

// ── Error model ───────────────────────────────────────────────

export const ERR = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  RATE_LIMIT: 'rate_limit',
  AUTH: 'auth', // expired/revoked authorization
  QUOTA: 'quota', // provider storage full
  NOT_FOUND: 'not_found',
  PERMISSION: 'permission',
  CHECKSUM: 'checksum',
  REJECTED: 'rejected',
  CONFLICT: 'conflict', // another tab holds the lease / stale state
  CANCELLED: 'cancelled',
  SOURCE_MISMATCH: 'source_mismatch',
  CAPACITY: 'capacity', // not enough combined capacity
  MEMORY: 'memory',
  METADATA: 'metadata',
  UNSUPPORTED: 'unsupported',
  UNKNOWN: 'unknown',
};

const RETRYABLE = new Set([ERR.NETWORK, ERR.TIMEOUT, ERR.RATE_LIMIT, ERR.METADATA]);

export class UnifiedError extends Error {
  constructor(kind, message, { retryAfterMs, cause, status } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'UnifiedError';
    this.kind = kind;
    this.retryable = RETRYABLE.has(kind);
    this.retryAfterMs = retryAfterMs;
    this.status = status;
  }
}

/** Normalize anything thrown (fetch TypeError, AbortError, Firestore errors) to a UnifiedError. */
export const toUnifiedError = (err) => {
  if (err instanceof UnifiedError) return err;
  if (err?.name === 'AbortError') return new UnifiedError(ERR.CANCELLED, 'Cancelled', { cause: err });
  if (err?.name === 'NotReadableError' || err?.name === 'NotFoundError') {
    return new UnifiedError(ERR.SOURCE_MISMATCH, 'The selected file can no longer be read (it may have been moved or modified).', { cause: err });
  }
  if (err instanceof RangeError || /allocation|out of memory/i.test(err?.message || '')) {
    return new UnifiedError(ERR.MEMORY, 'The browser ran out of memory while processing a chunk.', { cause: err });
  }
  const code = err?.code || '';
  if (code === 'permission-denied') return new UnifiedError(ERR.PERMISSION, 'Firebase denied access to this record.', { cause: err });
  if (code === 'unavailable' || code === 'deadline-exceeded' || code === 'aborted') {
    return new UnifiedError(ERR.METADATA, 'Could not save progress to Firebase.', { cause: err });
  }
  if (err instanceof TypeError) return new UnifiedError(ERR.NETWORK, 'Network request failed.', { cause: err });
  return new UnifiedError(ERR.UNKNOWN, err?.message || 'Unknown error', { cause: err });
};

/** Map an HTTP status to an error kind (provider-specific bodies are refined by adapters). */
export const kindForStatus = (status) => {
  if (status === 401) return ERR.AUTH;
  if (status === 403) return ERR.PERMISSION;
  if (status === 404) return ERR.NOT_FOUND;
  if (status === 408) return ERR.TIMEOUT;
  if (status === 429) return ERR.RATE_LIMIT;
  if (status === 507) return ERR.QUOTA;
  if (status >= 500) return ERR.NETWORK;
  return ERR.REJECTED;
};

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new UnifiedError(ERR.CANCELLED, 'Cancelled')); }, { once: true });
  });

export const backoffMs = (attempt, baseMs = 1000, maxMs = 60_000, random = Math.random) =>
  Math.min(maxMs, baseMs * 2 ** attempt) * (0.5 + random() / 2);

/** Bounded exponential backoff with jitter; honours Retry-After; never retries non-transient kinds. */
export const withRetry = async (fn, { retries = 4, baseMs = 1000, signal, onRetry } = {}) => {
  for (let attempt = 0; ; attempt++) {
    if (signal?.aborted) throw new UnifiedError(ERR.CANCELLED, 'Cancelled');
    try {
      return await fn(attempt);
    } catch (raw) {
      const err = toUnifiedError(raw);
      if (!err.retryable || attempt >= retries || signal?.aborted) throw err;
      onRetry?.(err, attempt + 1);
      await sleep(Math.max(err.retryAfterMs || 0, backoffMs(attempt, baseMs)), signal);
    }
  }
};

// ── State machines ────────────────────────────────────────────

export const FILE_TRANSITIONS = {
  planning: ['uploading', 'failed', 'deleting'],
  uploading: ['verifying', 'ready', 'failed', 'deleting', 'uploading'],
  verifying: ['ready', 'degraded', 'uploading', 'deleting'],
  ready: ['degraded', 'verifying', 'deleting'],
  degraded: ['ready', 'verifying', 'deleting', 'degraded'],
  failed: ['uploading', 'deleting'],
  deleting: ['deleting', 'deleted'],
  deleted: [],
};

export const CHUNK_TRANSITIONS = {
  pending: ['uploading', 'deleting'],
  uploading: ['uploading', 'uploaded', 'verified', 'pending', 'deleting'],
  uploaded: ['uploading', 'verifying', 'verified', 'corrupted', 'pending', 'deleting'],
  verifying: ['uploading', 'verified', 'corrupted', 'missing', 'deleting'],
  verified: ['verified', 'corrupted', 'missing', 'deleting'],
  corrupted: ['uploading', 'verified', 'deleting'],
  missing: ['uploading', 'verified', 'deleting'],
  deleting: ['deleting', 'deleted'],
  deleted: [],
};

export const SESSION_TRANSITIONS = {
  active: ['active', 'paused', 'interrupted', 'cancelled', 'completed', 'cleanup_pending'],
  paused: ['active', 'cancelled', 'cleanup_pending'],
  interrupted: ['active', 'cancelled', 'cleanup_pending'],
  cancelled: ['cleanup_pending'],
  completed: ['cleanup_pending'],
  cleanup_pending: ['cleanup_pending'],
};

const assertIn = (table, kind) => (from, to) => {
  if (from === to && table[from]) return;
  if (!table[from]?.includes(to)) throw new UnifiedError(ERR.CONFLICT, `Invalid ${kind} transition ${from} → ${to}`);
};
export const assertFileTransition = assertIn(FILE_TRANSITIONS, 'file');
export const assertChunkTransition = assertIn(CHUNK_TRANSITIONS, 'chunk');
export const assertSessionTransition = assertIn(SESSION_TRANSITIONS, 'session');

/** A session whose lease expired while "active" means the tab died: show it as interrupted. */
export const effectiveSessionState = (file, now = Date.now()) =>
  file?.sessionState === 'active' && (file.leaseExpiresAt || 0) < now ? 'interrupted' : file?.sessionState;

// ── Record rules shared by the Firestore and in-memory repositories ──

/** Throws CONFLICT unless `owner` holds a live lease on an active upload session. */
export const checkLease = (file, owner, now) => {
  if (!file) throw new UnifiedError(ERR.NOT_FOUND, 'Upload record not found.');
  if (file.sessionState !== 'active' || file.leaseOwner !== owner) {
    throw new UnifiedError(ERR.CONFLICT, 'This upload is now controlled elsewhere (another tab, or it was paused/deleted).');
  }
  if ((file.leaseExpiresAt || 0) < now - 5_000) {
    // Small grace: our own heartbeat may be a few seconds late.
    throw new UnifiedError(ERR.CONFLICT, 'Upload lease expired; resume to continue.');
  }
};

/** Patch for taking over a session. Refuses while another tab's lease is live. */
export const acquireLeasePatch = (file, owner, leaseMs, now) => {
  if (!file) throw new UnifiedError(ERR.NOT_FOUND, 'Upload record not found.');
  if (!['uploading', 'failed'].includes(file.state)) throw new UnifiedError(ERR.CONFLICT, `Cannot upload a file in state "${file.state}".`);
  if (['cancelled', 'cleanup_pending', 'completed'].includes(file.sessionState)) {
    throw new UnifiedError(ERR.CONFLICT, 'This upload session has ended.');
  }
  if (file.sessionState === 'active' && file.leaseOwner && file.leaseOwner !== owner && file.leaseExpiresAt > now) {
    throw new UnifiedError(ERR.CONFLICT, 'This upload is running in another tab or window.');
  }
  assertSessionTransition(file.sessionState, 'active');
  return { state: 'uploading', sessionState: 'active', leaseOwner: owner, leaseExpiresAt: now + leaseMs, lastActivityAt: now };
};

/**
 * Apply a chunk patch; returns the new chunk and the file counter patch.
 * Counters change only on verified ↔ non-verified edges, so replays are idempotent.
 */
export const applyChunkPatch = (file, chunk, patch) => {
  if (!chunk) throw new UnifiedError(ERR.NOT_FOUND, 'Chunk record not found.');
  if (patch.state) assertChunkTransition(chunk.state, patch.state);
  const next = { ...chunk, ...patch };
  const was = chunk.state === 'verified';
  const is = next.state === 'verified';
  const filePatch = {};
  if (was !== is) {
    const sign = is ? 1 : -1;
    filePatch.verifiedCount = (file.verifiedCount || 0) + sign;
    filePatch.bytesVerified = (file.bytesVerified || 0) + sign * chunk.length;
  }
  return { chunk: next, filePatch };
};

export const cleanupJobId = (fileId, target) => `${fileId}_${String(target).replace(/[^A-Za-z0-9_-]/g, '_')}`.slice(0, 1400);

/** In-memory repository with the same contract as the Firestore one (tests, and a reference). */
export const createMemoryRepo = () => {
  const files = new Map();
  const chunks = new Map(); // fileId → Map(chunkId → chunk)
  const jobs = new Map();
  const clone = (v) => (v == null ? v : structuredClone(v));
  const getChunks = (id) => chunks.get(id) || new Map();
  return {
    _files: files, _chunks: chunks, _jobs: jobs,
    async createFile(doc, chunkDocs) {
      files.set(doc.id, clone(doc));
      chunks.set(doc.id, new Map(chunkDocs.map((c) => [c.id, clone(c)])));
    },
    async getFile(id) { return clone(files.get(id)) || null; },
    async listFiles() { return [...files.values()].map(clone); },
    async listChunks(id) { return [...getChunks(id).values()].sort((a, b) => a.index - b.index).map(clone); },
    async acquireLease(id, owner, leaseMs, now) {
      const f = files.get(id);
      Object.assign(f || {}, acquireLeasePatch(f, owner, leaseMs, now));
    },
    async renewLease(id, owner, leaseMs, now) {
      const f = files.get(id);
      checkLease(f, owner, now);
      Object.assign(f, { leaseExpiresAt: now + leaseMs, lastActivityAt: now });
    },
    async releaseLease(id, owner, sessionState, lastError = null) {
      const f = files.get(id);
      if (!f || f.leaseOwner !== owner || f.sessionState !== 'active') return;
      assertSessionTransition(f.sessionState, sessionState);
      Object.assign(f, { sessionState, leaseOwner: null, leaseExpiresAt: 0, lastError });
    },
    async updateFile(id, patch, { leaseOwner, now } = {}) {
      const f = files.get(id);
      if (!f) throw new UnifiedError(ERR.NOT_FOUND, 'File record not found.');
      if (leaseOwner) checkLease(f, leaseOwner, now);
      if (patch.state) assertFileTransition(f.state, patch.state);
      if (patch.sessionState) assertSessionTransition(f.sessionState, patch.sessionState);
      Object.assign(f, clone(patch));
    },
    async updateChunk(id, chunkId, patch, { leaseOwner, leaseMs = 0, now } = {}) {
      const f = files.get(id);
      if (leaseOwner) checkLease(f, leaseOwner, now);
      const { chunk, filePatch } = applyChunkPatch(f, getChunks(id).get(chunkId), patch);
      getChunks(id).set(chunkId, chunk);
      Object.assign(f, filePatch, leaseOwner ? { leaseExpiresAt: now + leaseMs, lastActivityAt: now } : {});
      return clone(chunk);
    },
    async beginDelete(id, owner, now) {
      const f = files.get(id);
      if (!f) throw new UnifiedError(ERR.NOT_FOUND, 'File record not found.');
      if (f.sessionState === 'active' && f.leaseOwner && f.leaseOwner !== owner && f.leaseExpiresAt > now) {
        throw new UnifiedError(ERR.CONFLICT, 'Pause this upload in the other tab before deleting it.');
      }
      assertFileTransition(f.state, 'deleting');
      Object.assign(f, { state: 'deleting', sessionState: 'cleanup_pending', leaseOwner: null, leaseExpiresAt: 0, lastActivityAt: now });
    },
    async putCleanupJobs(list) { for (const j of list) if (!jobs.has(j.id)) jobs.set(j.id, clone(j)); },
    async listCleanupJobs(fileId) {
      return [...jobs.values()].filter((j) => !fileId || j.fileId === fileId).map(clone);
    },
    async updateCleanupJob(id, patch) { Object.assign(jobs.get(id), clone(patch)); },
    async deleteFileRecords(id) {
      files.delete(id);
      chunks.delete(id);
      for (const [k, j] of jobs) if (j.fileId === id) jobs.delete(k);
    },
    async deleteCleanupJobs(ids) { ids.forEach((i) => jobs.delete(i)); },
  };
};

// ── Capacity planner ──────────────────────────────────────────

// Keep headroom so we never plan to fill a drive to the last byte.
export const SAFETY_MARGIN_BYTES = 256 * 1024 * 1024;
export const SAFETY_MARGIN_RATIO = 0.02;

/**
 * Conservative usable bytes: provider-reported free space minus DriveUnify reservations and a margin.
 * `limit === null` means the provider reports unlimited storage.
 */
export const usableCapacity = ({ limit, used = 0 }, reserved = 0) => {
  if (limit === null) return Number.MAX_SAFE_INTEGER;
  const margin = Math.max(SAFETY_MARGIN_BYTES, Math.floor(limit * SAFETY_MARGIN_RATIO));
  return Math.max(0, limit - used - reserved - margin);
};

/**
 * Assign chunks to accounts. Each chunk goes to the account with the most remaining usable
 * space, which spreads load (and parallelism) across drives.
 * @param chunks   [{ index, length }]
 * @param accounts [{ email, provider, usable }]
 * @returns Map(index → { email, provider })
 */
export const allocateChunks = (chunks, accounts) => {
  const remaining = accounts.map((a) => ({ ...a, left: a.usable }));
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const capacity = remaining.reduce((s, a) => s + a.left, 0);
  if (!remaining.length) throw new UnifiedError(ERR.CAPACITY, 'No eligible connected drives.');
  if (capacity < total) {
    throw new UnifiedError(ERR.CAPACITY, `Not enough estimated free space: need ${total} bytes, ~${capacity} usable.`);
  }
  const plan = new Map();
  for (const c of chunks) {
    const best = remaining.reduce((a, b) => (b.left > a.left ? b : a));
    // Chunks are indivisible; a fragmented pool can fail even if the sum fits.
    if (best.left < c.length) throw new UnifiedError(ERR.CAPACITY, 'Free space is too fragmented across drives for this file.');
    best.left -= c.length;
    plan.set(c.index, { email: best.email, provider: best.provider });
  }
  return plan;
};

export const summarizePlan = (chunks, plan) => {
  const out = {};
  for (const c of chunks) {
    const t = plan.get(c.index);
    out[t.email] ||= { email: t.email, provider: t.provider, chunks: 0, bytes: 0 };
    out[t.email].chunks += 1;
    out[t.email].bytes += c.length;
  }
  return Object.values(out);
};

/** Run async work over items with at most `limit` in flight. */
export const runPool = async (items, limit, worker) => {
  let next = 0;
  let failure = null;
  const lane = async () => {
    while (next < items.length && !failure) {
      const item = items[next++];
      try { await worker(item); } catch (e) { failure ||= e; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  if (failure) throw failure;
};

/** Strip path separators/control chars so a stored name can never become a path. */
export const sanitizeFilename = (name) =>
  (String(name || 'download').replace(/[\\/:*?"<>|\p{Cc}]/gu, '_').replace(/^\.+/, '_').slice(0, 255)) || 'download';
