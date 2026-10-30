/**
 * unified/firestoreRepo.js
 *
 * Firestore implementation of the Unified Storage repository (same contract as createMemoryRepo).
 * Layout (owner-only by path, enforced in firestore.rules):
 *   users/{uid}/unified_files/{fileId}                 file + embedded upload session
 *   users/{uid}/unified_files/{fileId}/chunks/{cId}    one doc per logical chunk (never bytes)
 *   users/{uid}/unified_cleanup_jobs/{jobId}           persisted deletion work
 */

import {
  collection, doc, getDoc, getDocs, query, orderBy, limit, startAfter, where,
  runTransaction, writeBatch, updateDoc, deleteDoc,
} from 'firebase/firestore';
import {
  UnifiedError, ERR, checkLease, acquireLeasePatch, applyChunkPatch,
  assertFileTransition, assertSessionTransition,
} from './core.js';

const BATCH = 400; // Firestore allows 500 writes per batch
const PAGE = 200;

export const createFirestoreRepo = (db, uid) => {
  if (!db || !uid) throw new UnifiedError(ERR.PERMISSION, 'Sign in to use Unified Storage.');
  const filesCol = collection(db, 'users', uid, 'unified_files');
  const jobsCol = collection(db, 'users', uid, 'unified_cleanup_jobs');
  const fileRef = (id) => doc(filesCol, id);
  const chunksCol = (id) => collection(db, 'users', uid, 'unified_files', id, 'chunks');
  const chunkRef = (id, cId) => doc(chunksCol(id), cId);

  const mustGet = (snap) => {
    if (!snap.exists()) throw new UnifiedError(ERR.NOT_FOUND, 'Record not found.');
    return snap.data();
  };

  const inBatches = async (items, fn) => {
    for (let i = 0; i < items.length; i += BATCH) {
      const batch = writeBatch(db);
      items.slice(i, i + BATCH).forEach((item) => fn(batch, item));
      await batch.commit();
    }
  };

  const listAll = async (base) => {
    const out = [];
    let last = null;
    for (;;) {
      const snap = await getDocs(last ? query(base, startAfter(last), limit(PAGE)) : query(base, limit(PAGE)));
      out.push(...snap.docs.map((d) => d.data()));
      if (snap.size < PAGE) return out;
      last = snap.docs[snap.docs.length - 1];
    }
  };

  return {
    async createFile(fileDoc, chunkDocs) {
      // Chunks first, file doc last: a file record never points at a partial chunk set.
      await inBatches(chunkDocs, (b, c) => b.set(chunkRef(fileDoc.id, c.id), c));
      await inBatches([fileDoc], (b, f) => b.set(fileRef(f.id), f));
    },

    async getFile(id) {
      const snap = await getDoc(fileRef(id));
      return snap.exists() ? snap.data() : null;
    },

    // shortcut: loads up to the first 200 files; paginate in the UI if users keep more than that.
    async listFiles() {
      return (await getDocs(query(filesCol, orderBy('createdAt', 'desc'), limit(PAGE)))).docs.map((d) => d.data());
    },

    listChunks: (id) => listAll(query(chunksCol(id), orderBy('index'))),

    async acquireLease(id, owner, leaseMs, now) {
      await runTransaction(db, async (tx) => {
        const f = mustGet(await tx.get(fileRef(id)));
        tx.update(fileRef(id), acquireLeasePatch(f, owner, leaseMs, now));
      });
    },

    async renewLease(id, owner, leaseMs, now) {
      await runTransaction(db, async (tx) => {
        const f = mustGet(await tx.get(fileRef(id)));
        checkLease(f, owner, now);
        tx.update(fileRef(id), { leaseExpiresAt: now + leaseMs, lastActivityAt: now });
      });
    },

    async releaseLease(id, owner, sessionState, lastError = null) {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(fileRef(id));
        const f = snap.exists() ? snap.data() : null;
        if (!f || f.leaseOwner !== owner || f.sessionState !== 'active') return;
        assertSessionTransition(f.sessionState, sessionState);
        tx.update(fileRef(id), { sessionState, leaseOwner: null, leaseExpiresAt: 0, lastError });
      });
    },

    async updateFile(id, patch, { leaseOwner, now } = {}) {
      await runTransaction(db, async (tx) => {
        const f = mustGet(await tx.get(fileRef(id)));
        if (leaseOwner) checkLease(f, leaseOwner, now);
        if (patch.state) assertFileTransition(f.state, patch.state);
        if (patch.sessionState) assertSessionTransition(f.sessionState, patch.sessionState);
        tx.update(fileRef(id), patch);
      });
    },

    async updateChunk(id, cId, patch, { leaseOwner, leaseMs = 0, now } = {}) {
      return runTransaction(db, async (tx) => {
        const f = mustGet(await tx.get(fileRef(id)));
        const c = mustGet(await tx.get(chunkRef(id, cId)));
        if (leaseOwner) checkLease(f, leaseOwner, now);
        const { chunk, filePatch } = applyChunkPatch(f, c, patch);
        tx.set(chunkRef(id, cId), chunk);
        const lease = leaseOwner ? { leaseExpiresAt: now + leaseMs, lastActivityAt: now } : {};
        if (Object.keys(filePatch).length || leaseOwner) tx.update(fileRef(id), { ...filePatch, ...lease });
        return chunk;
      });
    },

    async beginDelete(id, owner, now) {
      await runTransaction(db, async (tx) => {
        const f = mustGet(await tx.get(fileRef(id)));
        if (f.sessionState === 'active' && f.leaseOwner && f.leaseOwner !== owner && f.leaseExpiresAt > now) {
          throw new UnifiedError(ERR.CONFLICT, 'Pause this upload in the other tab before deleting it.');
        }
        assertFileTransition(f.state, 'deleting');
        tx.update(fileRef(id), { state: 'deleting', sessionState: 'cleanup_pending', leaseOwner: null, leaseExpiresAt: 0, lastActivityAt: now });
      });
    },

    async putCleanupJobs(jobs) {
      // Deterministic IDs + create-if-absent keeps re-enqueueing idempotent.
      for (const j of jobs) {
        await runTransaction(db, async (tx) => {
          const ref = doc(jobsCol, j.id);
          if (!(await tx.get(ref)).exists()) tx.set(ref, j);
        });
      }
    },

    listCleanupJobs: (fileId) => listAll(fileId ? query(jobsCol, where('fileId', '==', fileId)) : jobsCol),

    updateCleanupJob: (id, patch) => updateDoc(doc(jobsCol, id), patch),

    async deleteCleanupJobs(ids) {
      await inBatches(ids, (b, i) => b.delete(doc(jobsCol, i)));
    },

    async deleteFileRecords(id) {
      for (;;) {
        const snap = await getDocs(query(chunksCol(id), limit(BATCH)));
        if (!snap.size) break;
        await inBatches(snap.docs, (b, d) => b.delete(d.ref));
      }
      const jobs = await getDocs(query(jobsCol, where('fileId', '==', id)));
      await inBatches(jobs.docs, (b, d) => b.delete(d.ref));
      await deleteDoc(fileRef(id));
    },
  };
};
