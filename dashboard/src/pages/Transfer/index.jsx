import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowLeftRight, ArrowRight, Check, CheckCircle2, ChevronRight, Folder, FolderOpen,
  Home, Plus, RotateCcw, Search, Square, X, XCircle, Zap,
} from 'lucide-react';
import { FileIcon } from '../../components/explorer/FileIcon';
import { CloudProviderIcon } from '../../components/common/ProviderBadge';
import { Spinner } from '../../components/common/Spinner';
import { useAccountsWithStorage, useFolderFiles } from '../../hooks/useDrive';
import { transferFile, transferFolder, countFilesInFolder } from '../../services/google-drive/transfer';
import { listFoldersInFolder } from '../../api/googleDriveApi';
import { listDropboxFolders } from '../../api/dropboxApi';
import { setConnectModalOpen } from '../../store/slices/uiSlice';
import { getAccountColor } from '../../config/constants';
import { formatFileSize, formatRelativeDate } from '../../utils/formatters';
import { getAccountId, getFileAccountId, isFolder } from '../../utils/helpers';
import { isAccountExpired } from '../../utils/storage';

const isDbx = (a) => (a?.provider || '').toLowerCase().includes('dropbox');
const providerLabel = (a) => (isDbx(a) ? 'Dropbox' : 'Google Drive');
const rootFolder = (a) => (isDbx(a) ? { id: '', name: 'Dropbox' } : { id: 'root', name: 'My Drive' });
const fileKey = (f) => `${getFileAccountId(f)}|${f.id}`;
// File being dragged from the source list (DataTransfer can't carry objects)
let draggedFile = null;
let seq = 0;

const small = { fontSize: '0.75rem', color: 'var(--color-text-secondary)' };
const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

// ── Drive cards ───────────────────────────────────────────────
const DriveCard = ({ account, selected, disabled, onClick, onDrop, dropHint }) => {
  const [over, setOver] = useState(false);
  const s = account.storage || {};
  const pct = s.limit ? Math.min(100, (s.used / s.limit) * 100) : 0;
  const color = getAccountColor(account);
  return (
    <motion.button
      type="button"
      layout
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      onDragOver={onDrop ? (e) => { e.preventDefault(); setOver(true); } : undefined}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop ? (e) => { e.preventDefault(); setOver(false); onDrop(); } : undefined}
      title={dropHint}
      style={{
        textAlign: 'left', padding: 12, borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
        background: selected ? `color-mix(in srgb, ${color} 10%, var(--color-bg-surface))` : 'var(--color-bg-surface)',
        border: `1.5px ${over ? 'dashed' : 'solid'} ${selected || over ? color : 'var(--color-border)'}`,
        display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, color: 'var(--color-text-primary)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <CloudProviderIcon provider={account.provider} size={16} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, ...ellipsis }}>{account.email}</span>
          <span style={small}>{providerLabel(account)}</span>
        </span>
        {selected && <Check size={16} style={{ color, flexShrink: 0 }} aria-hidden="true" />}
      </span>
      <span style={{ display: 'block', height: 6, borderRadius: 3, background: 'var(--color-bg-overlay)', overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </span>
      <span style={{ ...small, fontVariantNumeric: 'tabular-nums' }}>
        {isAccountExpired(account) ? 'Needs reconnect' : s.limit ? `${formatFileSize(Math.max(0, s.limit - s.used))} free of ${formatFileSize(s.limit)}` : 'Storage unknown'}
      </span>
    </motion.button>
  );
};

const Breadcrumbs = ({ account, path, onJump }) => (
  <nav aria-label="Folder path" style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none', fontSize: '0.8125rem' }}>
    <button type="button" className="du-icon-btn" onClick={() => onJump(-1)} disabled={!path.length} aria-label="Up one folder" style={{ flexShrink: 0 }}>
      <ArrowLeft size={14} />
    </button>
    <button type="button" className="du-link-btn" onClick={() => onJump(0)} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: path.length ? 400 : 600 }}>
      <Home size={13} /> {rootFolder(account).name}
    </button>
    {path.map((p, i) => (
      <span key={p.id || p.pathLower} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <ChevronRight size={12} style={{ opacity: 0.5 }} />
        <button type="button" className="du-link-btn" onClick={() => onJump(i + 1)} style={{ maxWidth: 160, ...ellipsis, fontWeight: i === path.length - 1 ? 600 : 400 }}>
          {p.name}
        </button>
      </span>
    ))}
  </nav>
);

const jumpTo = (setPath) => (n) => setPath((p) => (n === -1 ? p.slice(0, -1) : p.slice(0, n)));

// ── Source: browse and tick files/folders ─────────────────────
const SourceBrowser = ({ account, selected, onToggle, onToggleAll, disabled }) => {
  const [path, setPath] = useState([]);
  const [query, setQuery] = useState('');
  const folder = path.at(-1) || null;
  const { data = [], isLoading, error } = useFolderFiles(account, folder);


  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((f) => !f.trashed && (!q || f.name.toLowerCase().includes(q)))
      .sort((a, b) => Number(isFolder(b)) - Number(isFolder(a)) || a.name.localeCompare(b.name));
  }, [data, query]);
  const allTicked = items.length > 0 && items.every((f) => selected[fileKey(f)]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
      <Breadcrumbs account={account} path={path} onJump={jumpTo(setPath)} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', height: 34, borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }}>
          <Search size={14} aria-hidden="true" style={{ color: 'var(--color-text-muted)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this folder"
            aria-label="Search this folder"
            style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: 'inherit', fontSize: '0.8125rem' }}
          />
        </label>
        <button type="button" className="du-btn" disabled={disabled || !items.length} onClick={() => onToggleAll(items, !allTicked)} style={{ height: 34 }}>
          {allTicked ? 'Clear all' : 'Select all'}
        </button>
      </div>

      <div role="list" className="scrollbar-thin" style={{ overflowY: 'auto', maxHeight: 420, minHeight: 220, border: '1px solid var(--color-border)', borderRadius: 12, padding: 4 }}>
        {isLoading ? (
          <div style={{ display: 'grid', placeItems: 'center', height: 200 }}><Spinner /></div>
        ) : error ? (
          <p style={{ ...small, padding: 16, color: '#dc2626' }}>{error.message}</p>
        ) : !items.length ? (
          <p style={{ ...small, padding: 24, textAlign: 'center' }}>{query ? 'No matches' : 'This folder is empty'}</p>
        ) : items.map((f) => {
          const ticked = !!selected[fileKey(f)];
          const dir = isFolder(f);
          return (
            <div
              key={fileKey(f)}
              role="listitem"
              draggable={!disabled}
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', f.name); e.dataTransfer.effectAllowed = 'copy'; draggedFile = f; }}
              onDragEnd={() => { draggedFile = null; }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8,
                background: ticked ? 'var(--color-bg-overlay)' : 'transparent', cursor: disabled ? 'default' : 'grab',
              }}
            >
              <input type="checkbox" checked={ticked} disabled={disabled} onChange={() => onToggle(f)} aria-label={`Select ${f.name}`} style={{ width: 16, height: 16, accentColor: getAccountColor(account), flexShrink: 0 }} />
              <FileIcon category={dir ? 'folder' : f.category} size={18} />
              <button
                type="button"
                onClick={() => (dir ? setPath((p) => [...p, f]) : !disabled && onToggle(f))}
                style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 0, padding: 0, color: 'inherit', cursor: 'pointer' }}
                title={dir ? 'Open folder' : f.name}
              >
                <span style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, ...ellipsis }}>{f.name}</span>
                <span style={small}>{dir ? 'Folder' : `${formatFileSize(f.size)} · ${formatRelativeDate(f.modifiedTime)}`}</span>
              </button>
              {dir && <ChevronRight size={14} style={{ opacity: 0.4, flexShrink: 0 }} aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Destination: browse folders; the open folder is the target ─
const DestinationBrowser = ({ account, path, setPath }) => {
  const current = path.at(-1) || rootFolder(account);
  const { data: folders = [], isLoading, error } = useQuery({
    queryKey: ['folders', account.provider, account.email, current.id],
    queryFn: () => (isDbx(account)
      ? listDropboxFolders(account.accessToken, current.id).then((r) => r || [])
      : listFoldersInFolder(account.accessToken, current.id, account.email).then((r) => r?.files || [])),
    enabled: !!account.accessToken,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Breadcrumbs account={account} path={path} onJump={jumpTo(setPath)} />
      <div className="scrollbar-thin" style={{ overflowY: 'auto', maxHeight: 220, minHeight: 120, border: '1px solid var(--color-border)', borderRadius: 12, padding: 4 }}>
        {isLoading ? (
          <div style={{ display: 'grid', placeItems: 'center', height: 110 }}><Spinner /></div>
        ) : error ? (
          <p style={{ ...small, padding: 16, color: '#dc2626' }}>{error.message}</p>
        ) : !folders.length ? (
          <p style={{ ...small, padding: 20, textAlign: 'center' }}>No subfolders here</p>
        ) : folders.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setPath((p) => [...p, { id: f.id, name: f.name }])}
            className="du-btn"
            style={{ width: '100%', justifyContent: 'flex-start', border: 0, height: 34 }}
          >
            <Folder size={15} style={{ color: '#f59e0b', flexShrink: 0 }} aria-hidden="true" />
            <span style={{ flex: 1, textAlign: 'left', ...ellipsis }}>{f.name}</span>
            <ChevronRight size={14} style={{ opacity: 0.4 }} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'var(--color-bg-elevated)', fontSize: '0.8125rem' }}>
        <FolderOpen size={15} style={{ color: getAccountColor(account), flexShrink: 0 }} aria-hidden="true" />
        <span style={{ minWidth: 0, ...ellipsis }}>Files land in <strong>{current.name}</strong></span>
      </div>
    </div>
  );
};

// ── Animated link between the two panels ──────────────────────
const FlowLink = ({ active, from, to, onSwap, canSwap }) => (
  <div className="du-transfer-flow" aria-hidden={!canSwap}>
    <div className="du-transfer-track" style={{ '--from': from, '--to': to }}>
      {active && [0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="du-transfer-dot"
          initial={{ left: '0%', opacity: 0 }}
          animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.45, ease: 'easeInOut' }}
          style={{ background: to }}
        />
      ))}
    </div>
    <motion.button
      type="button"
      className="du-icon-btn du-icon-btn-outline"
      whileHover={{ rotate: 180 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onSwap}
      disabled={!canSwap}
      aria-label="Swap source and destination"
      title="Swap source and destination"
      style={{ background: 'var(--color-bg-surface)', position: 'relative' }}
    >
      <ArrowLeftRight size={16} />
    </motion.button>
  </div>
);

// ── Queue row ─────────────────────────────────────────────────
const STATUS = {
  queued: { label: 'Queued', color: 'var(--color-text-muted)' },
  counting: { label: 'Counting files…', color: 'var(--color-text-secondary)' },
  running: { label: 'Copying', color: '#3b82f6' },
  done: { label: 'Done', color: '#16a34a', icon: CheckCircle2 },
  error: { label: 'Failed', color: '#dc2626', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'var(--color-text-muted)', icon: X },
};

const QueueRow = ({ item, onRetry, onRemove }) => {
  const st = STATUS[item.status];
  const Icon = st.icon;
  const busy = item.status === 'running' || item.status === 'counting';
  const detail = item.isFolder
    ? item.total ? `${item.filesDone} of ${item.total} files${item.currentFile ? ` · ${item.currentFile}` : ''}` : item.currentFile
    : item.mode === 'stream' ? 'Streaming through the browser'
      : item.mode === 'export' ? 'Exported from Google format'
        : item.mode === 'cloud_copy' ? 'Server-side copy' : '';
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)' }}
    >
      <FileIcon category={item.isFolder ? 'folder' : item.file.category} size={20} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', minWidth: 0 }}>
          <span style={{ fontWeight: 500, ...ellipsis }}>{item.file.name}</span>
          <ArrowRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} aria-hidden="true" />
          <span style={{ ...small, ...ellipsis }}>{item.dest.email} / {item.destFolder.name}</span>
        </div>
        <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'var(--color-bg-overlay)', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${item.status === 'done' ? 100 : item.progress ?? 0}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
            style={{ height: '100%', borderRadius: 2, background: item.status === 'error' ? '#dc2626' : getAccountColor(item.dest) }}
          />
        </div>
        <div style={{ marginTop: 4, display: 'flex', gap: 8, ...small }}>
          <span style={{ color: st.color, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {Icon && <Icon size={12} aria-hidden="true" />}{st.label}{item.status === 'running' && item.progress != null ? ` ${Math.round(item.progress)}%` : ''}
          </span>
          <span style={{ minWidth: 0, ...ellipsis }} title={item.error || detail}>{item.error || detail}</span>
        </div>
      </div>
      {busy && <Spinner size="sm" />}
      {(item.status === 'error' || item.status === 'cancelled') && (
        <button type="button" className="du-icon-btn" onClick={() => onRetry(item.key)} aria-label={`Retry ${item.file.name}`} title="Retry">
          <RotateCcw size={14} />
        </button>
      )}
      {!busy && (
        <button type="button" className="du-icon-btn" onClick={() => onRemove(item.key)} aria-label={`Remove ${item.file.name} from list`} title="Remove">
          <X size={14} />
        </button>
      )}
    </motion.li>
  );
};

// ── Page ──────────────────────────────────────────────────────
const Transfer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state: navState } = useLocation();
  const queryClient = useQueryClient();
  const accounts = useAccountsWithStorage();
  const usable = accounts.filter((a) => !isAccountExpired(a));
  const byId = useMemo(() => Object.fromEntries(accounts.map((a) => [getAccountId(a), a])), [accounts]);

  // Optional preset from the caller: { files: [file] } or { sourceId, destId }
  const presetFiles = navState?.files || [];
  const [sourceId, setSourceId] = useState(navState?.sourceId || (presetFiles[0] && getFileAccountId(presetFiles[0])) || '');
  const [destId, setDestId] = useState(navState?.destId || '');
  const [selected, setSelected] = useState(() => Object.fromEntries(presetFiles.map((f) => [fileKey(f), f])));
  const [destNav, setDestNav] = useState({ key: '', path: [] });
  const [queue, setQueue] = useState([]);
  const [running, setRunning] = useState(false);
  const queueRef = useRef([]);
  const abortRef = useRef(null);

  const source = byId[sourceId] || usable[0];
  const destOptions = usable.filter((a) => getAccountId(a) !== getAccountId(source || {}));
  const dest = (destId && destId !== getAccountId(source || {}) && byId[destId]) || destOptions[0];
  const destKey = dest ? getAccountId(dest) : '';
  const destPath = destNav.key === destKey ? destNav.path : [];
  const setDestPath = (fn) => setDestNav({ key: destKey, path: typeof fn === 'function' ? fn(destPath) : fn });
  const destFolder = destPath.at(-1) || (dest && rootFolder(dest));
  // Abort an in-flight copy when leaving the page
  useEffect(() => () => abortRef.current?.abort(), []);

  const picked = Object.values(selected);
  const pickedBytes = picked.reduce((s, f) => s + (Number(f.size) || 0), 0);
  const hasFolders = picked.some(isFolder);
  const destFree = dest?.storage?.limit ? Math.max(0, dest.storage.limit - dest.storage.used) : null;
  const tooBig = destFree != null && pickedBytes > destFree;

  // The ref is the source of truth so the runner sees changes before React re-renders
  const updateQueue = (fn) => {
    queueRef.current = fn(queueRef.current);
    setQueue(queueRef.current);
  };
  const patch = (key, fields) => updateQueue((q) => q.map((i) => (i.key === key ? { ...i, ...fields } : i)));

  const toggle = (f) => setSelected((s) => {
    const next = { ...s };
    if (next[fileKey(f)]) delete next[fileKey(f)];
    else next[fileKey(f)] = f;
    return next;
  });
  const toggleAll = (items, on) => setSelected((s) => {
    const next = { ...s };
    items.forEach((f) => (on ? (next[fileKey(f)] = f) : delete next[fileKey(f)]));
    return next;
  });

  const chooseSource = (id) => {
    if (id === getAccountId(source)) return;
    setSelected({});
    if (id === getAccountId(dest || {})) setDestId(getAccountId(source));
    setSourceId(id);
  };
  const swap = () => {
    setSelected({});
    setSourceId(getAccountId(dest));
    setDestId(getAccountId(source));
  };

  // Processes queued items one at a time; items added while running are picked up too
  const runQueue = async () => {
    if (abortRef.current) return;
    setRunning(true);
    let next;
    const touched = new Set();
    while ((next = queueRef.current.find((i) => i.status === 'queued'))) {
      const item = next;
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        if (item.isFolder) {
          patch(item.key, { status: 'counting' });
          const total = await countFilesInFolder(item.src, item.file.id).catch(() => 0);
          if (controller.signal.aborted) throw new DOMException('Transfer aborted', 'AbortError');
          patch(item.key, { status: 'running', total, filesDone: 0, progress: total ? 0 : null });
          await transferFolder(item.src, item.dest, item.file, item.destFolder.id, ({ filesDone, currentFile }) => {
            patch(item.key, { filesDone, currentFile, progress: total ? (filesDone / total) * 100 : null });
          }, { done: 0, total }, controller.signal);
        } else {
          patch(item.key, { status: 'running', progress: 0 });
          const result = await transferFile(item.src, item.dest, item.file, item.destFolder.id, (pct, meta) => {
            patch(item.key, { progress: pct, ...(meta?.mode && { mode: meta.mode }) });
          }, controller.signal);
          if (result?.transferMode) patch(item.key, { mode: result.transferMode });
        }
        patch(item.key, { status: 'done', progress: 100 });
        touched.add(getAccountId(item.dest));
      } catch (err) {
        const aborted = controller.signal.aborted || err.name === 'AbortError';
        patch(item.key, { status: aborted ? 'cancelled' : 'error', error: aborted ? '' : err.message || 'Transfer failed' });
        if (aborted) updateQueue((q) => q.map((i) => (i.status === 'queued' ? { ...i, status: 'cancelled' } : i)));
      }
    }
    abortRef.current = null;
    setRunning(false);

    touched.forEach((id) => ['files', 'storage', 'allFiles'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k, id] })));
    const done = queueRef.current.filter((i) => i.status === 'done').length;
    const failed = queueRef.current.filter((i) => i.status === 'error').length;
    if (failed) toast.error(`${failed} ${failed === 1 ? 'item' : 'items'} failed to copy`);
    else if (done) toast.success(`Copied ${done} ${done === 1 ? 'item' : 'items'}`);
  };

  const start = () => {
    if (!source || !dest || !picked.length) return;
    const items = picked.map((f) => ({
      key: `${fileKey(f)}#${(seq += 1)}`, file: f, src: source, dest, destFolder, isFolder: isFolder(f), status: 'queued', progress: 0,
    }));
    updateQueue((q) => [...q, ...items]);
    setSelected({});
    runQueue();
  };

  const retry = (key) => {
    patch(key, { status: 'queued', progress: 0, error: '' });
    runQueue();
  };

  // ── Not enough drives ──
  if (usable.length < 2) {
    return (
      <div className="du-page" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', paddingTop: 64 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Connect a second drive</h1>
        <p style={{ ...small, fontSize: '0.875rem' }}>Transfers copy files between two connected Google Drive or Dropbox accounts.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="du-btn" onClick={() => navigate('/dashboard')}><ArrowLeft size={14} /> Back</button>
          <button className="du-btn du-btn-primary" onClick={() => dispatch(setConnectModalOpen(true))}><Plus size={14} /> Connect drive</button>
        </div>
      </div>
    );
  }

  const srcColor = getAccountColor(source);
  const destColor = getAccountColor(dest);

  return (
    <div style={{ height: '100%', overflowY: 'auto' }} className="scrollbar-thin">
      <div className="du-page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="du-icon-btn du-icon-btn-outline" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={16} /></button>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: 0, fontSize: '1.625rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Transfer files</h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Pick what to copy and where it goes. You can also drag files onto a destination drive.
            </p>
          </div>
        </div>

        <div className="du-transfer-grid">
          {/* Source */}
          <section className="du-card" aria-labelledby="src-heading" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, borderTop: `3px solid ${srcColor}` }}>
            <h2 id="src-heading" className="du-section-title" style={{ margin: 0 }}>From</h2>
            <div className="du-transfer-drives">
              {usable.map((a) => (
                <DriveCard key={getAccountId(a)} account={a} selected={getAccountId(a) === getAccountId(source)} disabled={running} onClick={() => chooseSource(getAccountId(a))} />
              ))}
            </div>
            <SourceBrowser key={getAccountId(source)} account={source} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
          </section>

          <FlowLink active={running} from={srcColor} to={destColor} onSwap={swap} canSwap={!running && !!dest} />

          {/* Destination */}
          <section className="du-card" aria-labelledby="dest-heading" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, borderTop: `3px solid ${destColor}` }}>
            <h2 id="dest-heading" className="du-section-title" style={{ margin: 0 }}>To</h2>
            <div className="du-transfer-drives">
              {usable.map((a) => {
                const id = getAccountId(a);
                const isSrc = id === getAccountId(source);
                return (
                  <DriveCard
                    key={id}
                    account={a}
                    selected={id === getAccountId(dest || {})}
                    disabled={isSrc}
                    onClick={() => setDestId(id)}
                    dropHint={isSrc ? 'This is the source drive' : 'Drop files here'}
                    onDrop={isSrc ? undefined : () => {
                      const f = draggedFile;
                      if (f) setSelected((s) => ({ ...s, [fileKey(f)]: f }));
                      setDestId(id);
                    }}
                  />
                );
              })}
            </div>
            {dest && <DestinationBrowser account={dest} path={destPath} setPath={setDestPath} />}

            {/* Summary + action */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
              <AnimatePresence initial={false}>
                {picked.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {picked.slice(0, 6).map((f) => (
                        <motion.span
                          key={fileKey(f)}
                          layout
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: 200, padding: '3px 6px 3px 8px', borderRadius: 999, background: 'var(--color-bg-overlay)', fontSize: '0.75rem' }}
                        >
                          <span style={ellipsis}>{f.name}</span>
                          <button type="button" onClick={() => toggle(f)} aria-label={`Unselect ${f.name}`} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex' }}>
                            <X size={12} />
                          </button>
                        </motion.span>
                      ))}
                      {picked.length > 6 && <span style={{ ...small, alignSelf: 'center' }}>+{picked.length - 6} more</span>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ ...small, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', fontVariantNumeric: 'tabular-nums' }}>
                <span>{picked.length} selected · {formatFileSize(pickedBytes) === '—' ? '0 B' : formatFileSize(pickedBytes)}{hasFolders ? ' + folder contents' : ''}</span>
                {destFree != null && <span style={{ color: tooBig ? '#dc2626' : undefined }}>{tooBig ? 'Not enough space · ' : ''}{formatFileSize(destFree)} free</span>}
              </div>

              <motion.button
                type="button"
                className="du-btn du-btn-primary du-btn-lg"
                whileTap={{ scale: 0.98 }}
                onClick={start}
                disabled={!picked.length || !dest || tooBig}
                style={{ width: '100%', background: picked.length && !tooBig ? destColor : undefined, borderColor: picked.length && !tooBig ? destColor : undefined }}
              >
                <Zap size={15} />
                {picked.length ? `Copy ${picked.length} ${picked.length === 1 ? 'item' : 'items'} to ${destFolder?.name}` : 'Select files to copy'}
              </motion.button>
            </div>
          </section>
        </div>

        {/* Queue */}
        {queue.length > 0 && (
          <section aria-labelledby="queue-heading" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 id="queue-heading" className="du-section-title" style={{ margin: 0, flex: 1 }}>
                Transfers · {queue.filter((i) => i.status === 'done').length}/{queue.length} done
              </h2>
              {running ? (
                <button className="du-btn" onClick={() => abortRef.current?.abort()}><Square size={13} /> Stop</button>
              ) : (
                <button className="du-btn" onClick={() => updateQueue((q) => q.filter((i) => i.status !== 'done'))}>Clear finished</button>
              )}
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8 }}>
              <AnimatePresence initial={false}>
                {[...queue].reverse().map((item) => (
                  <QueueRow key={item.key} item={item} onRetry={retry} onRemove={(k) => updateQueue((q) => q.filter((i) => i.key !== k))} />
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default Transfer;
