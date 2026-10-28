/**
 * unified/engine.js
 *
 * Upload / resume / repair / integrity / delete / cleanup / download coordinator.
 * Dependencies are injected so the whole flow runs in tests without Firebase or the network:
 *   repo         – Firestore repository (or createMemoryRepo())
 *   adapters     – { google_drive, dropbox } provider adapters
 *   listAccounts – () => connected accounts [{ email, provider, accessToken, needsReconnect }]
 *   getAccount   – (email, { force }) => account with a fresh access token
 *
 * Firestore is the source of truth; in-memory state here is only for progress display.
 */

import {
  DEFAULT_CHUNK_SIZE, LAYOUT_VERSION, UPLOAD_CONCURRENCY, DOWNLOAD_CONCURRENCY,
  planChunks, objectName, hashChunk, sha256Hex, manifestHash,
  UnifiedError, ERR, toUnifiedError, withRetry, backoffMs,
  usableCapacity, allocateChunks, summarizePlan, runPool, cleanupJobId,
} from './core.js';
import { ADAPTERS, providerOf } from './providers.js';

const randomId = () => globalThis.crypto.randomUUID().replace(/-/g, '');
const IN_PROGRESS = new Set(['planning', 'uploading', 'failed']);
const MAX_VERIFY_ATTEMPTS = 3;
const CLEANUP_BASE_MS = 30_000;
const CLEANUP_MAX_MS = 60 * 60 * 1000;

export const createEngine = ({
  repo,
  adapters = ADAPTERS,
  listAccounts,
  getAccount,
  tabId = randomId(),
  now = () => Date.now(),
  chunkSize = DEFAULT_CHUNK_SIZE,
  leaseMs = 120_000,
  retry = {},
}) => {
  // ── Provider calls: fresh token, one forced refresh on auth failure, bounded retries ──

  const withAccount = async (email, fn) => {
    let account = await getAccount(email);
    if (!account?.accessToken) throw new UnifiedError(ERR.AUTH, `Reconnect ${email} to continue.`);
    try {
      return await fn(account);
    } catch (err) {
      if (toUnifiedError(err).kind !== ERR.AUTH) throw err;
      account = await getAccount(email, { force: true });
      if (!account?.accessToken) throw new UnifiedError(ERR.AUTH, `Authorization for ${email} expired or was revoked. Reconnect it to continue.`);
      return fn(account);
    }
  };

  const call = (provider, email, op, args, signal) => {
    const adapter = adapters[provider];
    if (!adapter) throw new UnifiedError(ERR.UNSUPPORTED, `Unsupported provider ${provider}`);
    return withRetry(() => withAccount(email, (acc) => adapter[op](acc, ...args)), { signal, ...retry });
  };

  /** Verify with provider metadata; fall back to reading the object back when the provider has no checksum. */
  const verifyStrong = async (target, objectId, chunk, signal) => {
    const status = await call(target.provider, target.email, 'verifyObject', [objectId, chunk], signal);
    if (status !== 'unknown') return status;
    const buf = await call(target.provider, target.email, 'downloadObject', [objectId, signal], signal);
    return buf.byteLength === chunk.length && (await sha256Hex(buf)) === chunk.sha256 ? 'verified' : 'mismatch';
  };

  const cleanupJob = (fileId, chunk, target, { objectId = null, objectName: name = null }) => ({
    id: cleanupJobId(fileId, objectId || name),
    fileId,
    chunkIndex: chunk.index,
    provider: target.provider,
    accountEmail: target.email,
    objectId,
    objectName: name,
    status: 'pending',
    retryCount: 0,
    nextRetryAt: 0,
    lastError: null,
    createdAt: now(),
    completedAt: null,
  });

  // ── Capacity ──────────────────────────────────────────────

  const eligibleAccounts = async (allowed) =>
    (await listAccounts()).filter((a) =>
      a.accessToken && !a.needsReconnect && adapters[providerOf(a)] && (!allowed || allowed.includes(a.email)));

  /** Per-account estimate: provider quota − DriveUnify reservations of other in-progress uploads − margin. */
  const getCapacities = async ({ allowed, excludeFileId } = {}) => {
    const reserved = {};
    for (const f of await repo.listFiles()) {
      if (f.id === excludeFileId || !IN_PROGRESS.has(f.state)) continue;
      for (const r of f.reservations || []) reserved[r.email] = (reserved[r.email] || 0) + r.bytes;
    }
    return Promise.all((await eligibleAccounts(allowed)).map(async (a) => {
      const provider = providerOf(a);
      const base = { email: a.email, provider, reserved: reserved[a.email] || 0 };
      try {
        const cap = await call(provider, a.email, 'getCapacity', []);
        return { ...base, ...cap, usable: usableCapacity(cap, base.reserved), error: null };
      } catch (err) {
        // Unknown quota → treat as zero usable; never guess.
        return { ...base, limit: 0, used: 0, usable: 0, error: toUnifiedError(err).message };
      }
    }));
  };

  const reservationsOf = (chunks) => {
    const out = {};
    for (const c of chunks) if (c.state !== 'verified') out[c.accountEmail] = (out[c.accountEmail] || 0) + c.length;
    return Object.entries(out).map(([email, bytes]) => ({ email, bytes }));
  };

  const distributionOf = (chunks) => {
    const out = {};
    for (const c of chunks) {
      out[c.accountEmail] ||= { email: c.accountEmail, provider: c.provider, chunks: 0 };
      out[c.accountEmail].chunks += 1;
    }
    return Object.values(out);
  };

  const planUpload = async ({ size }, { accountEmails } = {}) => {
    const chunks = planChunks(size, chunkSize);
    const capacities = await getCapacities({ allowed: accountEmails });
    const plan = allocateChunks(chunks, capacities.filter((c) => c.usable > 0));
    return { chunks, plan, capacities, summary: summarizePlan(chunks, plan) };
  };

  // ── Upload ────────────────────────────────────────────────

  const startUpload = async (file, { accountEmails, signal, onProgress, onCreated } = {}) => {
    const { chunks, plan } = await planUpload(file, { accountEmails });
    const t = now();
    const fileId = randomId();
    const chunkDocs = chunks.map((c) => ({
      ...c,
      fileId,
      provider: plan.get(c.index).provider,
      accountEmail: plan.get(c.index).email,
      objectName: objectName(fileId, c.index),
      objectId: null,
      generation: 0,
      state: 'pending',
      sha256: null,
      contentHash: null,
      retryCount: 0,
      lastError: null,
      updatedAt: t,
      verifiedAt: null,
    }));
    await repo.createFile({
      id: fileId,
      schemaVersion: 1,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      lastModified: file.lastModified || null,
      chunkSize,
      chunkCount: chunks.length,
      layoutVersion: LAYOUT_VERSION,
      state: 'uploading',
      verifiedCount: 0,
      bytesVerified: 0,
      manifestSha256: null,
      placement: accountEmails ? 'manual' : 'auto',
      allowedAccounts: accountEmails || null,
      reservations: reservationsOf(chunkDocs),
      distribution: distributionOf(chunkDocs),
      sessionId: randomId(),
      sessionState: 'active',
      leaseOwner: tabId,
      leaseExpiresAt: t + leaseMs,
      lastActivityAt: t,
      lastError: null,
      createdAt: t,
      updatedAt: t,
    }, chunkDocs);
    onCreated?.(fileId);
    await runUpload(fileId, file, { signal, onProgress });
    return fileId;
  };

  /** Size must match exactly; name/mtime are only hints. Returns warnings to show the user. */
  const checkSourceIdentity = (doc, file) => {
    if (file.size !== doc.size) {
      throw new UnifiedError(ERR.SOURCE_MISMATCH, `Selected file is ${file.size} bytes but the original was ${doc.size} bytes.`);
    }
    const warnings = [];
    if (file.name !== doc.name) warnings.push(`File name differs ("${file.name}" vs "${doc.name}").`);
    if (doc.lastModified && file.lastModified !== doc.lastModified) warnings.push('Last-modified time differs; content will be verified.');
    return warnings;
  };

  /** Re-hash every source slice whose checksum is already recorded; any difference means a different file. */
  const verifySource = async (fileId, file, chunks, { signal, onProgress } = {}) => {
    const known = chunks.filter((c) => c.sha256);
    let done = 0;
    for (const c of known) {
      if (signal?.aborted) throw new UnifiedError(ERR.CANCELLED, 'Cancelled');
      const sha = await sha256Hex(await file.slice(c.offset, c.offset + c.length).arrayBuffer());
      if (sha !== c.sha256) {
        throw new UnifiedError(ERR.SOURCE_MISMATCH, `The selected file does not match the original (chunk ${c.index + 1} differs).`);
      }
      onProgress?.({ fileId, phase: 'verifying-source', done: ++done, total: known.length });
    }
  };

  const resumeUpload = async (fileId, file, { signal, onProgress } = {}) => {
    const doc = await repo.getFile(fileId);
    if (!doc || !IN_PROGRESS.has(doc.state)) throw new UnifiedError(ERR.CONFLICT, 'This upload cannot be resumed.');
    const warnings = checkSourceIdentity(doc, file);
    await repo.acquireLease(fileId, tabId, leaseMs, now());
    try {
      await verifySource(fileId, file, await repo.listChunks(fileId), { signal, onProgress });
    } catch (err) {
      const e = toUnifiedError(err);
      await repo.releaseLease(fileId, tabId, e.kind === ERR.CANCELLED ? 'paused' : 'interrupted', e.message).catch(() => {});
      throw e;
    }
    await runUpload(fileId, file, { signal, onProgress });
    return { warnings };
  };

  const runUpload = async (fileId, file, { signal, onProgress } = {}) => {
    await repo.acquireLease(fileId, tabId, leaseMs, now());
    const lease = () => ({ leaseOwner: tabId, leaseMs, now: now() });
    const heartbeat = setInterval(() => repo.renewLease(fileId, tabId, leaseMs, now()).catch(() => {}), leaseMs / 3);
    const doc = await repo.getFile(fileId);
    const byId = new Map((await repo.listChunks(fileId)).map((c) => [c.id, c]));
    const full = new Set(); // accounts that reported "storage full" during this run
    const started = now();
    let verifiedThisRun = 0;
    const active = new Set();

    const emit = (phase = 'uploading') => {
      const all = [...byId.values()];
      const bytesVerified = all.filter((c) => c.state === 'verified').reduce((s, c) => s + c.length, 0);
      const bytesUploaded = all.filter((c) => ['uploaded', 'verified'].includes(c.state)).reduce((s, c) => s + c.length, 0);
      const elapsed = (now() - started) / 1000;
      const speed = elapsed > 5 && verifiedThisRun ? verifiedThisRun / elapsed : null;
      onProgress?.({
        fileId, phase, total: doc.size, bytesUploaded, bytesVerified,
        verifiedCount: all.filter((c) => c.state === 'verified').length, chunkCount: all.length,
        activeChunks: [...active], speedBps: speed,
        etaSec: speed ? Math.round((doc.size - bytesVerified) / speed) : null,
      });
    };

    const save = async (chunk, patch) => {
      const next = await repo.updateChunk(fileId, chunk.id, { ...patch, updatedAt: now() }, lease());
      byId.set(chunk.id, next);
      return next;
    };

    const reassign = async (chunk) => {
      const caps = (await getCapacities({ allowed: doc.allowedAccounts, excludeFileId: fileId }))
        .filter((c) => !full.has(c.email) && c.usable > 0);
      let plan;
      try {
        plan = allocateChunks([chunk], caps);
      } catch {
        throw new UnifiedError(ERR.CAPACITY, 'Connected drives ran out of space. Connect another drive or free up space, then resume.');
      }
      const t = plan.get(chunk.index);
      const next = await save(chunk, { provider: t.provider, accountEmail: t.email, state: chunk.state === 'uploading' ? 'uploading' : chunk.state });
      await repo.updateFile(fileId, { reservations: reservationsOf([...byId.values()]) }, lease());
      return next;
    };

    const uploadOne = async (initial) => {
      let chunk = initial;
      active.add(chunk.index);
      emit();
      for (let attempt = 0; ; attempt++) {
        if (signal?.aborted) throw new UnifiedError(ERR.CANCELLED, 'Cancelled');
        if (full.has(chunk.accountEmail)) chunk = await reassign(chunk);
        const blob = file.slice(chunk.offset, chunk.offset + chunk.length);
        // Hash before upload; the chunk buffer goes out of scope immediately (fetch streams the Blob).
        const hashes = await hashChunk(await blob.arrayBuffer());
        if (chunk.sha256 && chunk.sha256 !== hashes.sha256) {
          throw new UnifiedError(ERR.SOURCE_MISMATCH, `The source file changed (chunk ${chunk.index + 1}). Reselect the original file.`);
        }
        const target = { provider: chunk.provider, email: chunk.accountEmail };
        chunk = await save(chunk, { state: 'uploading', ...hashes, retryCount: chunk.retryCount + (attempt || chunk.state !== 'pending' ? 1 : 0) });

        // Reconcile first: a previous attempt may have committed the object before metadata was saved.
        let objectId = null;
        const found = await call(target.provider, target.email, 'findObjects', [chunk.objectName], signal);
        const strays = [];
        for (const o of found) {
          if (!objectId && o.size === chunk.length && (await verifyStrong(target, o.objectId, chunk, signal)) === 'verified') objectId = o.objectId;
          else strays.push(o);
        }

        if (!objectId) {
          let obj;
          try {
            obj = await call(target.provider, target.email, 'uploadObject', [chunk.objectName, blob, hashes, signal], signal);
          } catch (err) {
            const e = toUnifiedError(err);
            if (e.kind === ERR.QUOTA) { full.add(target.email); continue; }
            if (e.kind === ERR.CHECKSUM && attempt + 1 < MAX_VERIFY_ATTEMPTS) continue;
            throw e;
          }
          chunk = await save(chunk, { state: 'uploaded', objectId: obj.objectId });
          emit();
          const status = await verifyStrong(target, obj.objectId, chunk, signal);
          if (status !== 'verified') {
            chunk = await save(chunk, { state: 'corrupted', lastError: `Post-upload verification: ${status}` });
            await repo.putCleanupJobs([cleanupJob(fileId, chunk, target, { objectId: obj.objectId })]);
            if (attempt + 1 >= MAX_VERIFY_ATTEMPTS) {
              throw new UnifiedError(ERR.CHECKSUM, `Chunk ${chunk.index + 1} failed verification on ${target.email} after ${MAX_VERIFY_ATTEMPTS} attempts.`);
            }
            continue;
          }
          objectId = obj.objectId;
        }
        if (strays.length) {
          await repo.putCleanupJobs(strays.filter((o) => o.objectId !== objectId).map((o) => cleanupJob(fileId, chunk, target, { objectId: o.objectId })));
        }
        chunk = await save(chunk, { state: 'verified', objectId, lastError: null, verifiedAt: now() });
        verifiedThisRun += chunk.length;
        active.delete(chunk.index);
        emit();
        return;
      }
    };

    try {
      emit();
      await runPool([...byId.values()].filter((c) => c.state !== 'verified'), UPLOAD_CONCURRENCY, uploadOne);
      const chunks = await repo.listChunks(fileId);
      if (chunks.length !== doc.chunkCount || chunks.some((c) => c.state !== 'verified')) {
        throw new UnifiedError(ERR.CONFLICT, 'Not every chunk is verified yet.');
      }
      emit('finalizing');
      await repo.updateFile(fileId, {
        state: 'ready',
        manifestSha256: await manifestHash(chunks.map((c) => c.sha256)),
        reservations: [],
        distribution: distributionOf(chunks),
        sessionState: 'completed',
        leaseOwner: null,
        leaseExpiresAt: 0,
        lastError: null,
        updatedAt: now(),
      }, lease());
      emit('done');
    } catch (raw) {
      const err = toUnifiedError(raw);
      if (err.kind !== ERR.CONFLICT) {
        await repo.releaseLease(fileId, tabId, err.kind === ERR.CANCELLED ? 'paused' : 'interrupted', err.kind === ERR.CANCELLED ? null : err.message).catch(() => {});
      }
      throw err;
    } finally {
      clearInterval(heartbeat);
    }
  };

  // ── Delete & cleanup ──────────────────────────────────────

  const deleteFile = async (fileId) => {
    await repo.beginDelete(fileId, tabId, now());
    const jobs = [];
    for (const c of await repo.listChunks(fileId)) {
      const target = { provider: c.provider, email: c.accountEmail };
      if (c.objectId) jobs.push(cleanupJob(fileId, c, target, { objectId: c.objectId }));
      // An in-flight upload may have committed an object we never recorded: find it by its exact tagged name.
      if (c.state !== 'pending' && c.state !== 'verified') jobs.push(cleanupJob(fileId, c, target, { objectName: c.objectName }));
    }
    await repo.putCleanupJobs(jobs);
    return runCleanup({ fileId, force: true });
  };

  /** Safe to call repeatedly; jobs complete only when the object is gone or confirmed absent. */
  const runCleanup = async ({ fileId, force = false } = {}) => {
    const jobs = (await repo.listCleanupJobs(fileId)).filter((j) => j.status === 'pending' && (force || j.nextRetryAt <= now()));
    await runPool(jobs, 3, async (job) => {
      try {
        if (job.objectId) {
          await call(job.provider, job.accountEmail, 'deleteObject', [job.objectId]);
        } else {
          const found = await call(job.provider, job.accountEmail, 'findObjects', [job.objectName]);
          for (const o of found) await call(job.provider, job.accountEmail, 'deleteObject', [o.objectId]);
        }
        await repo.updateCleanupJob(job.id, { status: 'done', completedAt: now(), lastError: null });
      } catch (err) {
        const retryCount = job.retryCount + 1;
        await repo.updateCleanupJob(job.id, {
          retryCount,
          nextRetryAt: now() + backoffMs(retryCount, CLEANUP_BASE_MS, CLEANUP_MAX_MS),
          lastError: toUnifiedError(err).message,
        });
      }
    });

    // Finalize metadata only when every known target of a deleting file is gone.
    const all = await repo.listCleanupJobs(fileId);
    const fileIds = new Set(all.map((j) => j.fileId));
    if (fileId) fileIds.add(fileId);
    let pending = 0;
    for (const id of fileIds) {
      const mine = all.filter((j) => j.fileId === id);
      const left = mine.filter((j) => j.status !== 'done').length;
      pending += left;
      if (left) continue;
      const f = await repo.getFile(id);
      if (f?.state === 'deleting') await repo.deleteFileRecords(id);
      else await repo.deleteCleanupJobs(mine.map((j) => j.id));
    }
    return { pending };
  };

  // ── Integrity check & repair ──────────────────────────────

  const markChunk = async (fileId, chunk, state, reason) => {
    await repo.updateChunk(fileId, chunk.id, { state, lastError: reason, updatedAt: now() });
    const f = await repo.getFile(fileId);
    if (f.state !== 'degraded') await repo.updateFile(fileId, { state: 'degraded', lastError: reason, updatedAt: now() });
  };

  /** Metadata-only check (no bytes downloaded). Network failures are reported, never treated as corruption. */
  const checkIntegrity = async (fileId) => {
    const doc = await repo.getFile(fileId);
    if (!['ready', 'degraded'].includes(doc?.state)) throw new UnifiedError(ERR.CONFLICT, 'Only completed files can be checked.');
    const result = { problems: [], unchecked: 0, unreachable: [] };
    const chunks = await repo.listChunks(fileId);
    await runPool(chunks, 3, async (c) => {
      if (!c.objectId) { result.problems.push({ index: c.index, state: 'missing', email: c.accountEmail }); return; }
      try {
        const status = await call(c.provider, c.accountEmail, 'verifyObject', [c.objectId, c]);
        if (status === 'unknown') result.unchecked++;
        else if (status === 'verified' && c.state !== 'verified') await repo.updateChunk(fileId, c.id, { state: 'verified', lastError: null });
        else if (status !== 'verified') {
          const state = status === 'missing' ? 'missing' : 'corrupted';
          if (c.state !== state) await repo.updateChunk(fileId, c.id, { state, lastError: `Integrity check: ${status}` });
          result.problems.push({ index: c.index, state, email: c.accountEmail });
        }
      } catch (err) {
        result.unreachable.push({ index: c.index, email: c.accountEmail, reason: toUnifiedError(err).message });
      }
    });
    if (result.problems.length) {
      if (doc.state !== 'degraded') await repo.updateFile(fileId, { state: 'degraded', lastError: `${result.problems.length} chunk(s) missing or corrupted.` });
    } else if (doc.state === 'degraded' && !result.unreachable.length) {
      const fresh = await repo.listChunks(fileId);
      if (fresh.every((c) => c.state === 'verified')) await repo.updateFile(fileId, { state: 'ready', lastError: null });
    }
    return result;
  };

  /** Rebuild missing/corrupted chunks from the original file; old objects are only cleaned up after the replacement verifies. */
  const repairFile = async (fileId, file, { signal, onProgress } = {}) => {
    const doc = await repo.getFile(fileId);
    if (!['degraded', 'ready'].includes(doc?.state)) throw new UnifiedError(ERR.CONFLICT, 'This file is not in a repairable state.');
    const warnings = checkSourceIdentity(doc, file);
    const bad = (await repo.listChunks(fileId)).filter((c) => c.state === 'corrupted' || c.state === 'missing');
    let done = 0;
    for (const c of bad) {
      if (signal?.aborted) throw new UnifiedError(ERR.CANCELLED, 'Cancelled');
      const blob = file.slice(c.offset, c.offset + c.length);
      const hashes = await hashChunk(await blob.arrayBuffer());
      if (hashes.sha256 !== c.sha256) throw new UnifiedError(ERR.SOURCE_MISMATCH, `The selected file does not match chunk ${c.index + 1} of the original.`);
      const generation = (c.generation || 0) + 1;
      const name = objectName(fileId, c.index, generation);
      const candidates = [{ provider: c.provider, email: c.accountEmail }];
      for (const cap of await getCapacities({ allowed: doc.allowedAccounts })) {
        if (cap.usable >= c.length && cap.email !== c.accountEmail) candidates.push(cap);
      }
      let placed = null;
      let lastErr = null;
      for (const target of candidates) {
        try {
          const obj = await call(target.provider, target.email, 'uploadObject', [name, blob, hashes, signal], signal);
          const status = await verifyStrong(target, obj.objectId, { ...c, ...hashes }, signal);
          if (status !== 'verified') {
            await repo.putCleanupJobs([cleanupJob(fileId, c, target, { objectId: obj.objectId })]);
            throw new UnifiedError(ERR.CHECKSUM, 'Replacement failed verification.');
          }
          placed = { target, objectId: obj.objectId };
          break;
        } catch (err) {
          lastErr = toUnifiedError(err);
          if (lastErr.kind === ERR.CANCELLED) throw lastErr;
        }
      }
      if (!placed) throw lastErr || new UnifiedError(ERR.CAPACITY, 'No drive could store the replacement chunk.');
      await repo.updateChunk(fileId, c.id, {
        state: 'verified', objectId: placed.objectId, objectName: name, generation,
        provider: placed.target.provider, accountEmail: placed.target.email, lastError: null, verifiedAt: now(), updatedAt: now(),
      });
      if (c.objectId) await repo.putCleanupJobs([cleanupJob(fileId, c, { provider: c.provider, email: c.accountEmail }, { objectId: c.objectId })]);
      onProgress?.({ fileId, phase: 'repairing', done: ++done, total: bad.length });
    }
    const chunks = await repo.listChunks(fileId);
    if (chunks.every((c) => c.state === 'verified')) {
      await repo.updateFile(fileId, { state: 'ready', distribution: distributionOf(chunks), lastError: null, updatedAt: now() });
    }
    await runCleanup({ fileId }).catch(() => {});
    return { repaired: done, warnings };
  };

  // ── Download & reconstruction ─────────────────────────────

  /**
   * Fetch chunks with bounded look-ahead, verify each (length + SHA-256) and write strictly in order.
   * At most DOWNLOAD_CONCURRENCY chunk buffers are alive at any time.
   * sink: { write(Uint8Array), close(), abort() }
   */
  const downloadFile = async (fileId, sink, { signal, onProgress } = {}) => {
    const doc = await repo.getFile(fileId);
    if (doc?.state !== 'ready') throw new UnifiedError(ERR.CONFLICT, 'Only files marked ready can be downloaded.');
    const chunks = await repo.listChunks(fileId);
    let expectOffset = 0;
    for (const c of chunks) {
      if (c.state !== 'verified' || !c.objectId || c.offset !== expectOffset) {
        throw new UnifiedError(ERR.CONFLICT, `Chunk ${c.index + 1} is not available; run an integrity check.`);
      }
      expectOffset += c.length;
    }
    if (chunks.length !== doc.chunkCount || expectOffset !== doc.size) throw new UnifiedError(ERR.CONFLICT, 'Chunk metadata is incomplete.');

    const fetchVerified = async (c) => {
      for (let attempt = 0; ; attempt++) {
        const buf = await call(c.provider, c.accountEmail, 'downloadObject', [c.objectId, signal], signal);
        if (buf.byteLength === c.length && (await sha256Hex(buf)) === c.sha256) return buf;
        // One re-read before declaring corruption, in case the transfer itself was damaged.
        if (attempt >= 1) throw new UnifiedError(ERR.CHECKSUM, `Chunk ${c.index + 1} failed its checksum.`);
      }
    };

    const inflight = new Map();
    let next = 0;
    let written = 0;
    const launch = () => {
      while (inflight.size < DOWNLOAD_CONCURRENCY && next < chunks.length) {
        const c = chunks[next++];
        const p = fetchVerified(c);
        p.catch(() => {}); // observed below, in order
        inflight.set(c.index, p);
      }
    };

    try {
      for (const c of chunks) {
        launch();
        let buf;
        try {
          buf = await inflight.get(c.index);
        } catch (err) {
          const e = toUnifiedError(err);
          if (e.kind === ERR.CHECKSUM) await markChunk(fileId, c, 'corrupted', e.message);
          if (e.kind === ERR.NOT_FOUND) await markChunk(fileId, c, 'missing', `Chunk ${c.index + 1} is missing on ${c.accountEmail}.`);
          throw e;
        }
        inflight.delete(c.index);
        await sink.write(new Uint8Array(buf));
        written += buf.byteLength;
        onProgress?.({ fileId, phase: 'downloading', done: written, total: doc.size });
      }
      if (written !== doc.size) throw new UnifiedError(ERR.CHECKSUM, 'Reconstructed size does not match the original.');
      if (doc.manifestSha256 && (await manifestHash(chunks.map((c) => c.sha256))) !== doc.manifestSha256) {
        throw new UnifiedError(ERR.CHECKSUM, 'Whole-file checksum does not match.');
      }
      await sink.close();
    } catch (err) {
      try { await sink.abort?.(); } catch { /* the partial output is discarded either way */ }
      throw toUnifiedError(err);
    }
  };

  return {
    tabId, getCapacities, planUpload, startUpload, resumeUpload, deleteFile, runCleanup, checkIntegrity, repairFile, downloadFile,
  };
};
