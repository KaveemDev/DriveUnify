import { useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Layers, UploadCloud, Pause, Play, X, Download, Trash2, ShieldCheck, Wrench,
  RefreshCw, AlertTriangle, HardDrive, CheckCircle2, Clock,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { GoogleDriveIcon, DropboxIcon } from '../../components/common/ProviderBadge';
import { useUnifiedStorage } from '../../hooks/useUnifiedStorage';
import { formatFileSize } from '../../utils/formatters';
import { effectiveSessionState, toUnifiedError, DEFAULT_CHUNK_SIZE } from '../../services/unified/core';
import { canStreamToDisk, BLOB_FALLBACK_LIMIT } from '../../services/unified/sinks';

const INTEGRITY_WARNING =
  'DriveUnify detected a problem with one or more file chunks. The original file may be incomplete or corrupted. We will attempt to repair the affected data before marking the file ready for download.';

const card = {
  padding: 16, borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)',
};
const muted = { fontSize: '0.75rem', color: 'var(--color-text-muted)' };
const label = { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' };

const ProviderIcon = ({ provider }) =>
  provider === 'dropbox' ? <DropboxIcon size={14} /> : <GoogleDriveIcon size={14} />;

const fmtTime = (ms) => (ms ? new Date(ms).toLocaleString() : '—');
const fmtEta = (s) => (s == null ? null : s > 3600 ? `${Math.round(s / 360) / 10} h` : s > 60 ? `${Math.round(s / 60)} min` : `${s} s`);

/** One label the user understands, derived from file state + session state + whether this tab runs it. */
const statusOf = (f, running) => {
  if (running) return { text: 'Uploading', tone: 'info' };
  if (f.state === 'ready') return { text: 'Ready', tone: 'ok' };
  if (f.state === 'degraded') return { text: 'Needs repair', tone: 'bad' };
  if (f.state === 'deleting') return { text: 'Cleanup pending', tone: 'warn' };
  const s = effectiveSessionState(f);
  if (s === 'active') return { text: 'Uploading in another tab', tone: 'info' };
  if (s === 'paused') return { text: 'Paused', tone: 'warn' };
  return { text: 'Interrupted', tone: 'warn' };
};

const TONES = {
  ok: { color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  info: { color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
  warn: { color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  bad: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
};

const Pill = ({ tone, children }) => (
  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, color: TONES[tone].color, background: TONES[tone].bg, whiteSpace: 'nowrap' }}>
    {children}
  </span>
);

const Stat = ({ icon: Icon, title, value, hint }) => (
  <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...muted }}><Icon size={14} />{title}</div>
    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{value}</div>
    {hint && <div style={muted}>{hint}</div>}
  </div>
);

const Bar = ({ uploaded, verified, total }) => (
  <div aria-hidden style={{ position: 'relative', height: 6, borderRadius: 3, background: 'var(--color-bg-elevated)', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, width: `${total ? (uploaded / total) * 100 : 0}%`, background: 'rgba(37,99,235,0.35)' }} />
    <div style={{ position: 'absolute', inset: 0, width: `${total ? (verified / total) * 100 : 0}%`, background: '#2563eb' }} />
  </div>
);

export default function UnifiedStorage() {
  const us = useUnifiedStorage();
  const [file, setFile] = useState(null);
  const [manual, setManual] = useState(false);
  const [selected, setSelected] = useState([]);
  const [plan, setPlan] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cancelFor, setCancelFor] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const pickRef = useRef(null);
  const pickAction = useRef(null);

  const eligible = us.capacities.filter((c) => !c.error);
  const totalUsable = eligible.reduce((s, c) => s + Math.min(c.usable, Number.MAX_SAFE_INTEGER), 0);
  const unlimited = eligible.some((c) => c.limit === null);
  const reserved = us.capacities.reduce((s, c) => s + c.reserved, 0);
  const counts = useMemo(() => ({
    incomplete: us.files.filter((f) => ['uploading', 'failed', 'planning'].includes(f.state)).length,
    ready: us.files.filter((f) => f.state === 'ready').length,
    degraded: us.files.filter((f) => f.state === 'degraded').length,
  }), [us.files]);

  const onDrop = (accepted) => {
    if (accepted[0]) { setFile(accepted[0]); setPlan(null); }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const accountEmails = manual ? selected : undefined;

  const review = async () => {
    setPlanning(true);
    try {
      setPlan(await us.planUpload(file, accountEmails));
    } catch (err) {
      setPlan({ error: toUnifiedError(err).message });
    } finally {
      setPlanning(false);
    }
  };

  const start = async () => {
    const f = file;
    setStarting(true);
    setFile(null);
    setPlan(null);
    try {
      await us.startUpload(f, accountEmails);
    } finally {
      setStarting(false);
    }
  };

  /** Resume and repair both need the original file reselected; the engine verifies it. */
  const pickSourceFor = (fileId, action) => {
    pickAction.current = { fileId, action };
    pickRef.current.value = '';
    pickRef.current.click();
  };
  const onPicked = (e) => {
    const picked = e.target.files?.[0];
    const { fileId, action } = pickAction.current || {};
    if (!picked || !fileId) return;
    if (action === 'resume') us.resumeUpload(fileId, picked);
    else us.repair(fileId, picked);
  };

  const cancel = (fileId) => {
    us.pause(fileId);
    setCancelFor(us.files.find((f) => f.id === fileId) || { id: fileId });
  };

  if (!us.available) {
    return <div style={{ padding: 24, ...muted }}>Sign in to use Unified Storage.</div>;
  }

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <input ref={pickRef} type="file" hidden onChange={onPicked} />

      <header>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          <Layers size={20} /> Unified Storage
        </h1>
        <p style={{ ...muted, fontSize: '0.8125rem', marginTop: 6, maxWidth: 760, lineHeight: 1.5 }}>
          Store one file across several connected drives. Files are split into {formatFileSize(DEFAULT_CHUNK_SIZE)} chunks, each kept once on
          one drive and verified with SHA-256. This is not a backup: if a drive loses a chunk, the file can only be repaired from the original.
        </p>
      </header>

      {/* ── Overview ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Stat icon={HardDrive} title="Estimated free space" value={unlimited ? 'Unlimited*' : formatFileSize(totalUsable)} hint="Estimate from provider quotas; not guaranteed writable" />
        <Stat icon={Clock} title="Reserved by uploads" value={formatFileSize(reserved)} />
        <Stat icon={UploadCloud} title="Incomplete uploads" value={counts.incomplete} />
        <Stat icon={CheckCircle2} title="Ready files" value={counts.ready} />
        <Stat icon={AlertTriangle} title="Need repair" value={counts.degraded} />
        <Stat icon={Trash2} title="Pending cleanup" value={us.jobs.length} hint={us.jobs.length ? 'Retried automatically while you use DriveUnify' : null} />
      </section>

      {/* ── Accounts ── */}
      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={label}>Drives in the pool</span>
          <Button size="xs" variant="ghost" icon={RefreshCw} onClick={us.refreshCapacity}>Refresh</Button>
        </div>
        {us.connectedAccounts.length === 0 && <div style={muted}>Connect a Google Drive or Dropbox account to start.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {us.connectedAccounts.map((a) => {
            const cap = us.capacities.find((c) => c.email === a.email);
            const status = a.needsReconnect ? 'Reconnect required' : !a.accessToken ? 'Connecting…' : cap?.error ? `Quota unavailable: ${cap.error}` : null;
            return (
              <label key={a.email} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                {manual && (
                  <input
                    type="checkbox"
                    disabled={!cap || !!cap.error}
                    checked={selected.includes(a.email)}
                    onChange={(e) => { setPlan(null); setSelected((s) => (e.target.checked ? [...s, a.email] : s.filter((x) => x !== a.email))); }}
                  />
                )}
                <ProviderIcon provider={a.provider} />
                <span style={{ color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.email}</span>
                <span style={{ marginLeft: 'auto', ...muted }}>
                  {status || (cap ? (cap.limit === null ? 'Unlimited' : `${formatFileSize(cap.usable)} usable of ${formatFileSize(cap.limit)}`) : '…')}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* ── Upload ── */}
      <section style={card}>
        <div style={{ ...label, marginBottom: 10 }}>Upload a file</div>
        <div
          {...getRootProps()}
          style={{
            border: `1.5px dashed ${isDragActive ? '#2563eb' : 'var(--color-border-strong, var(--color-border))'}`, borderRadius: 10,
            padding: 24, textAlign: 'center', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.8125rem',
          }}
        >
          <input {...getInputProps()} aria-label="Choose a file for Unified Storage" />
          <UploadCloud size={22} style={{ marginBottom: 6 }} />
          <div>{file ? <><b>{file.name}</b> · {formatFileSize(file.size)}</> : 'Drop a file here, or click to choose'}</div>
        </div>

        {file && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
              <label><input type="radio" checked={!manual} onChange={() => { setManual(false); setPlan(null); }} /> Automatic placement</label>
              <label><input type="radio" checked={manual} onChange={() => { setManual(true); setPlan(null); }} /> Choose drives (tick them above)</label>
            </div>
            {!canStreamToDisk() && file.size > BLOB_FALLBACK_LIMIT && (
              <div style={{ ...muted, color: TONES.warn.color }}>
                Heads-up: this browser can upload this file, but downloading files over 512 MB needs Chrome or Edge.
              </div>
            )}
            {plan?.error && <div style={{ fontSize: '0.8125rem', color: TONES.bad.color }}>{plan.error}</div>}
            {plan?.summary && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ marginBottom: 6 }}>{plan.chunks.length} chunks planned:</div>
                {plan.summary.map((s) => (
                  <div key={s.email} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ProviderIcon provider={s.provider} /> {s.email}: {s.chunks} chunk(s), {formatFileSize(s.bytes)}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="outline" loading={planning} disabled={manual && !selected.length} onClick={review}>Review plan</Button>
              <Button size="sm" icon={UploadCloud} loading={starting} disabled={!plan?.summary} onClick={start}>Start upload</Button>
            </div>
          </div>
        )}
      </section>

      {/* ── Files ── */}
      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={label}>Files</span>
          {us.jobs.length > 0 && <Button size="xs" variant="outline" icon={RefreshCw} onClick={us.retryCleanup}>Retry cleanup ({us.jobs.length})</Button>}
        </div>
        {us.loading && <div style={muted}>Loading…</div>}
        {!us.loading && us.files.length === 0 && <div style={muted}>No files yet.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {us.files.map((f) => {
            const running = us.isRunning(f.id);
            const p = us.progress[f.id];
            const st = statusOf(f, running);
            const jobsForFile = us.jobs.filter((j) => j.fileId === f.id);
            return (
              <div key={f.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ ...label, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{f.name}</span>
                  <Pill tone={st.tone}>{st.text}</Pill>
                  <span style={muted}>{formatFileSize(f.size)}</span>
                  <span style={{ ...muted, marginLeft: 'auto' }}>Last activity {fmtTime(f.lastActivityAt)}</span>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', ...muted }}>
                  <span>{f.verifiedCount}/{f.chunkCount} chunks verified</span>
                  {(f.distribution || []).map((d) => (
                    <span key={d.email} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <ProviderIcon provider={d.provider} />{d.email}: {d.chunks}
                    </span>
                  ))}
                </div>

                {(f.state === 'uploading' || p) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Bar uploaded={p?.bytesUploaded ?? f.bytesVerified} verified={p?.bytesVerified ?? f.bytesVerified} total={f.size} />
                    <div style={{ ...muted, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {p?.phase === 'verifying-source' && <span>Checking the selected file against the original: {p.done}/{p.total}</span>}
                      {p?.phase === 'repairing' && <span>Repairing: {p.done}/{p.total}</span>}
                      {p?.phase === 'downloading' && <span>Downloaded and verified {formatFileSize(p.done)} of {formatFileSize(p.total)}</span>}
                      {(!p || ['uploading', 'finalizing'].includes(p.phase)) && <>
                        <span>Uploaded {formatFileSize(p?.bytesUploaded ?? f.bytesVerified)}</span>
                        <span>Verified {formatFileSize(p?.bytesVerified ?? f.bytesVerified)}</span>
                        {p?.activeChunks?.length > 0 && <span>Chunk {p.activeChunks.map((i) => i + 1).join(', ')}</span>}
                        {p?.speedBps && <span>{formatFileSize(p.speedBps)}/s</span>}
                        {fmtEta(p?.etaSec) && <span>~{fmtEta(p.etaSec)} left</span>}
                      </>}
                    </div>
                  </div>
                )}

                {f.state === 'degraded' && (
                  <div role="alert" style={{ fontSize: '0.78rem', color: TONES.bad.color, background: TONES.bad.bg, padding: 8, borderRadius: 6, lineHeight: 1.5 }}>
                    {INTEGRITY_WARNING} {f.lastError && <><br />{f.lastError}</>}
                    <br />A complete download is not possible until the affected chunks are repaired. Select the original file to repair.
                  </div>
                )}
                {f.lastError && f.state === 'uploading' && !running && (
                  <div style={{ fontSize: '0.78rem', color: TONES.warn.color }}>{f.lastError}</div>
                )}
                {f.state === 'deleting' && (
                  <div style={{ fontSize: '0.78rem', color: TONES.warn.color, lineHeight: 1.5 }}>
                    {jobsForFile.length} stored chunk(s) still exist in your drives and could not be removed yet.
                    {jobsForFile[0]?.lastError && <> Last error: {jobsForFile[0].lastError}</>}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {running && f.state === 'uploading' && <>
                    <Button size="xs" variant="outline" icon={Pause} onClick={() => us.pause(f.id)}>Pause</Button>
                    <Button size="xs" variant="outline" icon={X} onClick={() => cancel(f.id)}>Cancel</Button>
                  </>}
                  {!running && f.state === 'uploading' && st.text !== 'Uploading in another tab' && <>
                    <Button size="xs" icon={Play} onClick={() => pickSourceFor(f.id, 'resume')}>Resume (select original file)</Button>
                    <Button size="xs" variant="outline" icon={Trash2} onClick={() => setDeleteFor(f)}>Delete incomplete upload</Button>
                  </>}
                  {f.state === 'ready' && !running && <>
                    <Button size="xs" icon={Download} onClick={() => us.download(f)}>Download</Button>
                    <Button size="xs" variant="outline" icon={ShieldCheck} onClick={() => us.checkIntegrity(f.id)}>Check integrity</Button>
                  </>}
                  {f.state === 'degraded' && !running && <>
                    <Button size="xs" icon={Wrench} onClick={() => pickSourceFor(f.id, 'repair')}>Repair (select original file)</Button>
                    <Button size="xs" variant="outline" icon={ShieldCheck} onClick={() => us.checkIntegrity(f.id)}>Check again</Button>
                  </>}
                  {running && f.state !== 'uploading' && <Button size="xs" variant="outline" icon={X} onClick={() => us.pause(f.id)}>Stop</Button>}
                  {['ready', 'degraded'].includes(f.state) && !running && (
                    <Button size="xs" variant="ghost" icon={Trash2} onClick={() => setDeleteFor(f)}>Delete</Button>
                  )}
                  {f.state === 'deleting' && <Button size="xs" variant="outline" icon={RefreshCw} onClick={us.retryCleanup}>Retry cleanup</Button>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Cancel: keep for later or delete ── */}
      <Modal open={!!cancelFor} onOpenChange={() => setCancelFor(null)} title="Upload stopped" description="What should happen to the chunks already stored?" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
          <Button variant="outline" onClick={() => setCancelFor(null)}>Keep it to resume later</Button>
          <Button variant="danger" onClick={() => { const f = cancelFor; setCancelFor(null); setDeleteFor(f); }}>Delete the incomplete upload</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteFor}
        onOpenChange={() => setDeleteFor(null)}
        title={`Delete "${deleteFor?.name || 'this upload'}"?`}
        description="All of its chunks will be removed from your connected drives. If a drive can't be reached, the file stays listed as cleanup pending until removal succeeds."
        confirmLabel="Delete"
        onConfirm={() => { const id = deleteFor.id; setDeleteFor(null); us.deleteFile(id); }}
      />
    </div>
  );
}
