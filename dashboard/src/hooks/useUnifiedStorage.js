import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { db } from '../config/firebase';
import { useDrive } from './useDrive';
import { createEngine } from '../services/unified/engine';
import { createFirestoreRepo } from '../services/unified/firestoreRepo';
import { createDownloadSink } from '../services/unified/sinks';
import { ERR, toUnifiedError } from '../services/unified/core';

const PROGRESS_UI_MS = 250; // UI throttle; durable progress is saved per chunk by the engine

/** Glue between the Unified Storage engine and the dashboard (accounts, tokens, toasts, progress). */
export const useUnifiedStorage = () => {
  const { connectedAccounts, getFreshAccount } = useDrive();
  const { user } = useSelector((s) => s.auth);
  const accountsRef = useRef(connectedAccounts);
  const freshRef = useRef(getFreshAccount);
  useEffect(() => {
    accountsRef.current = connectedAccounts;
    freshRef.current = getFreshAccount;
  });

  const [files, setFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [capacities, setCapacities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [running, setRunning] = useState(() => new Set());
  const setRun = (id, on) => setRunning((prev) => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n; });
  const controllers = useRef(new Map());
  const lastEmit = useRef({});

  const repo = useMemo(() => (user?.uid && db ? createFirestoreRepo(db, user.uid) : null), [user?.uid]);

  const engine = useMemo(() => repo && createEngine({
    repo,
    listAccounts: async () => accountsRef.current,
    getAccount: async (email, { force } = {}) => {
      const account = accountsRef.current.find((a) => a.email === email);
      if (!account) return null;
      // expiryDate 0 forces the existing refresh path (Cloud Function / Dropbox refresh).
      return freshRef.current(force ? { ...account, expiryDate: 0 } : account);
    },
  }), [repo]);

  const refresh = useCallback(async () => {
    if (!repo) return;
    try {
      const [f, j] = await Promise.all([repo.listFiles(), repo.listCleanupJobs()]);
      setFiles(f);
      setJobs(j.filter((x) => x.status === 'pending'));
    } catch (err) {
      toast.error(`Could not load Unified Storage: ${toUnifiedError(err).message}`);
    } finally {
      setLoading(false);
    }
  }, [repo]);

  const refreshCapacity = useCallback(async () => {
    if (engine) setCapacities(await engine.getCapacities().catch(() => []));
  }, [engine]);

  const readyAccounts = connectedAccounts.filter((a) => a.accessToken).map((a) => a.email).join(',');

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { refreshCapacity(); }, [refreshCapacity, readyAccounts]);

  // Retry due cleanup jobs whenever the user returns with accounts connected.
  useEffect(() => {
    if (!engine || !readyAccounts) return;
    engine.runCleanup().then(refresh).catch(() => {});
  }, [engine, readyAccounts, refresh]);

  const onProgress = useCallback((p) => {
    const now = Date.now();
    const final = ['done', 'finalizing'].includes(p.phase);
    if (!final && now - (lastEmit.current[p.fileId] || 0) < PROGRESS_UI_MS) return;
    lastEmit.current[p.fileId] = now;
    setProgress((prev) => ({ ...prev, [p.fileId]: { ...prev[p.fileId], ...p } }));
  }, []);

  const clearProgress = (id) => setProgress((prev) => { const n = { ...prev }; delete n[id]; return n; });

  /** Runs a long operation for one file; aborts are reported as pauses, everything else as an error toast. */
  const track = useCallback(async (key, fn) => {
    const ctrl = new AbortController();
    controllers.current.set(key, ctrl);
    setRun(key, true);
    try {
      return await fn(ctrl.signal);
    } catch (raw) {
      const err = toUnifiedError(raw);
      if (err.kind !== ERR.CANCELLED) toast.error(err.message, { duration: 6000 });
      throw err;
    } finally {
      controllers.current.delete(key);
      setRun(key, false);
      refresh();
      refreshCapacity();
    }
  }, [refresh, refreshCapacity]);

  const planUpload = useCallback((file, accountEmails) => engine.planUpload(file, { accountEmails }), [engine]);

  const startUpload = useCallback(async (file, accountEmails) => {
    let fileId;
    const tempKey = `new:${file.name}:${file.size}`;
    await track(tempKey, (signal) => engine.startUpload(file, {
      accountEmails,
      signal,
      onProgress,
      onCreated: (id) => {
        fileId = id;
        controllers.current.set(id, controllers.current.get(tempKey));
        setRun(id, true);
        refresh();
      },
    })).then(() => toast.success(`"${file.name}" is stored and verified.`)).catch(() => {});
    if (fileId) { controllers.current.delete(fileId); setRun(fileId, false); clearProgress(fileId); }
    return fileId;
  }, [engine, track, onProgress, refresh]);

  const resumeUpload = useCallback(async (fileId, file) => {
    await track(fileId, (signal) => engine.resumeUpload(fileId, file, { signal, onProgress }))
      .then(({ warnings }) => {
        warnings.forEach((w) => toast(w));
        toast.success(`"${file.name}" is stored and verified.`);
      }).catch(() => {});
    controllers.current.delete(fileId);
    clearProgress(fileId);
  }, [engine, track, onProgress]);

  /** Stops the transfer; the session is saved as paused and can be resumed or deleted later. */
  const pause = useCallback((fileId) => controllers.current.get(fileId)?.abort(), []);
  const isRunning = useCallback((fileId) => running.has(fileId), [running]);

  const deleteFile = useCallback(async (fileId) => {
    controllers.current.get(fileId)?.abort();
    try {
      const { pending } = await engine.deleteFile(fileId);
      if (pending) toast.error(`${pending} stored chunk(s) could not be removed yet. DriveUnify will retry; cleanup remains pending until then.`, { duration: 8000 });
      else toast.success('Deleted, including all stored chunks.');
    } catch (err) {
      toast.error(toUnifiedError(err).message);
    } finally {
      clearProgress(fileId);
      refresh();
      refreshCapacity();
    }
  }, [engine, refresh, refreshCapacity]);

  const retryCleanup = useCallback(async () => {
    const { pending } = await engine.runCleanup({ force: true });
    toast[pending ? 'error' : 'success'](pending ? `${pending} chunk(s) still pending cleanup.` : 'Cleanup complete.');
    refresh();
  }, [engine, refresh]);

  const download = useCallback(async (fileDoc) => {
    let sink;
    try {
      sink = await createDownloadSink(fileDoc); // first, inside the click gesture
    } catch (raw) {
      const err = toUnifiedError(raw);
      if (err.kind !== ERR.CANCELLED) toast.error(err.message, { duration: 8000 });
      return;
    }
    await track(fileDoc.id, (signal) => engine.downloadFile(fileDoc.id, sink, { signal, onProgress }))
      .then(() => toast.success(`Downloaded and verified "${fileDoc.name}".`)).catch(() => {});
    clearProgress(fileDoc.id);
  }, [engine, track, onProgress]);

  const checkIntegrity = useCallback(async (fileId) => {
    const r = await track(fileId, () => engine.checkIntegrity(fileId)).catch(() => null);
    if (!r) return;
    if (r.problems.length) toast.error(`${r.problems.length} chunk(s) are missing or corrupted.`);
    else if (r.unreachable.length) toast(`${r.unreachable.length} chunk(s) could not be checked right now (network or access issue). This does not mean they are corrupted.`);
    else toast.success(r.unchecked ? `No problems found (${r.unchecked} chunk(s) have no provider checksum to compare).` : 'All chunks verified by the providers.');
  }, [engine, track]);

  const repair = useCallback(async (fileId, file) => {
    await track(fileId, (signal) => engine.repairFile(fileId, file, { signal, onProgress }))
      .then(({ repaired }) => toast.success(`Repaired ${repaired} chunk(s).`)).catch(() => {});
    clearProgress(fileId);
  }, [engine, track, onProgress]);

  return {
    available: Boolean(engine), loading, files, jobs, capacities, progress, connectedAccounts,
    refresh, refreshCapacity, planUpload, startUpload, resumeUpload, pause, isRunning,
    deleteFile, retryCleanup, download, checkIntegrity, repair,
  };
};
