import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Spinner';
import { useAllAccountFiles, useAccountsWithStorage } from '../../hooks/useDrive';
import { formatFileSize, formatRelativeDate, formatDateTime } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';
import { getAccountId, getFileAccountId } from '../../utils/helpers';
import { isAccountExpired } from '../../utils/storage';
import { computeStorageStats, usageLevel } from '../../utils/storageStats';

const REFRESH_MS = 60 * 1000;
const providerLabel = (a) => (a.provider === 'dropbox' ? 'Dropbox' : 'Google Drive');
const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);
const fmtPct = (v) => `${v < 10 && v > 0 ? v.toFixed(1) : Math.round(v)}%`;
const size = (b) => (b > 0 ? formatFileSize(b) : '0 B');
const num = (n) => n.toLocaleString();

const LEVELS = {
  good: { label: 'Healthy', color: '#16a34a', icon: CheckCircle2 },
  warning: { label: 'Filling up', color: 'var(--color-warning)', icon: AlertTriangle },
  critical: { label: 'Almost full', color: '#dc2626', icon: AlertOctagon },
};

const muted = { color: 'var(--color-text-secondary)' };
const small = { fontSize: '0.75rem', color: 'var(--color-text-secondary)' };
const tabular = { fontVariantNumeric: 'tabular-nums' };

const Section = ({ title, hint, children, style }) => (
  <section className="du-card" style={{ padding: 20, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14, ...style }}>
    <div>
      <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{title}</h3>
      {hint && <p style={{ margin: '2px 0 0', ...small }}>{hint}</p>}
    </div>
    {children}
  </section>
);

const Stat = ({ label, value, sub }) => (
  <div className="du-card" style={{ padding: '14px 16px', minWidth: 0 }}>
    <div style={small}>{label}</div>
    <div style={{ marginTop: 4, fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...tabular }}>{value}</div>
    {sub && <div style={{ marginTop: 2, ...small, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sub}>{sub}</div>}
  </div>
);

const LevelBadge = ({ level }) => {
  const { label, color, icon: Icon } = LEVELS[level];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 500, color }}>
      <Icon size={13} aria-hidden="true" /> {label}
    </span>
  );
};

// Horizontal bars: label · bar · value. Every value is printed, so color is never the only cue.
const BarList = ({ rows, valueKey = 'size', format = size, extra }) => {
  const max = Math.max(1, ...rows.map((r) => r[valueKey]));
  const total = rows.reduce((s, r) => s + r[valueKey], 0);
  return (
    <div role="table" style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, max-content) 1fr auto', alignItems: 'center', gap: '8px 12px' }}>
      {rows.map((r) => (
        <React.Fragment key={r.key ?? r.label}>
          <span role="rowheader" style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {r.color && <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }} />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
          </span>
          <div
            title={`${r.label}: ${format(r[valueKey])} (${fmtPct(pct(r[valueKey], total))})`}
            style={{ height: 10, borderRadius: 4, background: 'var(--color-bg-overlay)', overflow: 'hidden' }}
          >
            <div style={{ height: '100%', width: `${pct(r[valueKey], max)}%`, minWidth: r[valueKey] > 0 ? 3 : 0, borderRadius: 4, background: r.color || 'var(--color-text-secondary)', transition: 'width 0.4s ease' }} />
          </div>
          <span role="cell" style={{ fontSize: '0.8125rem', textAlign: 'right', ...tabular }}>
            {format(r[valueKey])} <span style={small}>{extra ? extra(r) : fmtPct(pct(r[valueKey], total))}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

// Donut of used space by slice, with a hover readout in the centre
const Donut = ({ slices, centerLabel, centerValue }) => {
  const [hover, setHover] = useState(null);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  const gap = slices.filter((s) => s.value > 0).length > 1 ? 2 : 0;
  let offset = 0;
  const active = hover != null ? slices[hover] : null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label={slices.map((s) => `${s.label} ${size(s.value)}`).join(', ')} style={{ flexShrink: 0 }}>
        <circle cx="90" cy="90" r={R} fill="none" stroke="var(--color-bg-overlay)" strokeWidth="22" />
        {total > 0 && slices.map((s, i) => {
          const len = (s.value / total) * C;
          const dash = Math.max(0, len - gap);
          const el = (
            <circle
              key={s.key}
              cx="90" cy="90" r={R} fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? 28 : 22}
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 90 90)"
              style={{ transition: 'stroke-width 0.15s ease', cursor: 'default' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          );
          offset += len;
          return el;
        })}
        <text x="90" y="84" textAnchor="middle" style={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}>
          {active ? active.label.slice(0, 22) : centerLabel}
        </text>
        <text x="90" y="104" textAnchor="middle" style={{ fontSize: 17, fontWeight: 600, fill: 'var(--color-text-primary)' }}>
          {active ? size(active.value) : centerValue}
        </text>
      </svg>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 6, flex: '1 1 160px', minWidth: 0 }}>
        {slices.map((s, i) => (
          <li
            key={s.key}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', opacity: hover == null || hover === i ? 1 : 0.5 }}
          >
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
            <span style={tabular}>{size(s.value)}</span>
            <span style={{ ...small, width: 42, textAlign: 'right' }}>{fmtPct(pct(s.value, total))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Vertical columns with a hover tooltip; one series only, so no legend
const Columns = ({ data, valueKey, format, color = '#3B82F6', labelKey = 'label', tooltip }) => {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const W = 600, H = 170, top = 10, bottom = 22;
  const step = W / data.length;
  const bw = Math.min(36, step - 6);
  const h = (v) => ((H - top - bottom) * v) / max;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={data.map((d) => `${d[labelKey]} ${format(d[valueKey])}`).join(', ')} style={{ display: 'block', overflow: 'visible' }}>
        {[0.5, 1].map((t) => (
          <line key={t} x1="0" x2={W} y1={H - bottom - (H - top - bottom) * t} y2={H - bottom - (H - top - bottom) * t} stroke="var(--color-border)" strokeDasharray="3 3" />
        ))}
        <text x="0" y={top - 2} style={{ fontSize: 10, fill: 'var(--color-text-muted)' }}>{format(max)}</text>
        <line x1="0" x2={W} y1={H - bottom} y2={H - bottom} stroke="var(--color-border-strong)" />
        {data.map((d, i) => {
          const x = i * step + (step - bw) / 2;
          const bh = h(d[valueKey]);
          return (
            <g key={d.key ?? d[labelKey]} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={i * step} y={top} width={step} height={H - top - bottom} fill={hover === i ? 'var(--color-bg-overlay)' : 'transparent'} />
              <path
                d={bh > 0 ? `M${x},${H - bottom} v${-(bh - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${bh - 4} z` : ''}
                fill={color}
                opacity={hover == null || hover === i ? 1 : 0.55}
              />
              <text x={i * step + step / 2} y={H - 6} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--color-text-muted)' }}>{d[labelKey]}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div
          role="status"
          style={{
            position: 'absolute', top: 0, left: `${((hover + 0.5) / data.length) * 100}%`, transform: 'translate(-50%, -100%)',
            padding: '6px 10px', borderRadius: 8, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-popup)', fontSize: '0.75rem', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 1,
          }}
        >
          {tooltip(data[hover])}
        </div>
      )}
    </div>
  );
};

const FileRowList = ({ files, accountsById, render }) => (
  <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 2 }}>
    {files.map((f, i) => {
      const acct = accountsById[getFileAccountId(f)];
      return (
        <li key={`${f.accountEmail}-${f.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.8125rem' }}>
          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: acct ? getAccountColor(acct) : 'var(--color-text-muted)' }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.pathDisplay || f.name}>{f.name}</span>
            <span style={{ display: 'block', ...small, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.accountEmail} · modified {formatRelativeDate(f.modifiedTime)}
            </span>
          </span>
          {render(f)}
        </li>
      );
    })}
  </ol>
);

export const StorageAnalyticsModal = ({ open, onOpenChange }) => {
  const accounts = useAccountsWithStorage({ refetchInterval: open ? REFRESH_MS : undefined });
  const { byAccount, isFetching, isLoading, updatedAt } = useAllAccountFiles({ enabled: open, refetchInterval: REFRESH_MS });
  const queryClient = useQueryClient();
  const [scope, setScope] = useState('all');
  const [now, setNow] = useState(() => Date.now());

  // Tick the "updated x ago" label
  useEffect(() => {
    if (!open) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const accountsById = useMemo(() => Object.fromEntries(accounts.map((a) => [getAccountId(a), a])), [accounts]);
  const inScope = scope === 'all' ? accounts : accounts.filter((a) => getAccountId(a) === scope);

  const perAccount = useMemo(
    () => Object.fromEntries(Object.entries(byAccount).map(([id, q]) => [id, q.data ? computeStorageStats(q.data) : null])),
    [byAccount],
  );
  const stats = useMemo(
    () => computeStorageStats(inScope.flatMap((a) => byAccount[getAccountId(a)]?.data ?? [])),
    [byAccount, scope, accounts], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const quota = inScope.filter((a) => a.storage?.limit > 0);
  const used = quota.reduce((s, a) => s + (a.storage.used || 0), 0);
  const limit = quota.reduce((s, a) => s + a.storage.limit, 0);
  const trash = quota.reduce((s, a) => s + (a.storage.usedInDriveTrash || 0), 0);
  const free = Math.max(0, limit - used);
  const usedPct = pct(used, limit);

  // shortcut: linear pace from files created in the last 30 days; ignores deletions and non-file usage
  const daysToFull = stats.addedLast30 > 0 ? Math.round(free / (stats.addedLast30 / 30)) : null;

  const donutSlices = scope === 'all'
    ? quota.map((a) => ({ key: getAccountId(a), label: `${providerLabel(a)} · ${a.email}`, value: a.storage.used || 0, color: getAccountColor(a) }))
    : stats.categories.filter((c) => c.size > 0).map((c) => ({ key: c.key, label: c.label, value: c.size, color: c.color }));

  const scopeColor = scope === 'all' ? '#3B82F6' : getAccountColor(accountsById[scope] || scope);
  const pending = isLoading && stats.fileCount === 0;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      maxWidth="lg"
      title="Storage analytics"
      description={`${accounts.length} ${accounts.length === 1 ? 'drive' : 'drives'} · refreshes every minute`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Filters + freshness */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <div role="radiogroup" aria-label="Drive" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
            {[{ id: 'all', label: 'All drives' }, ...accounts.map((a) => ({ id: getAccountId(a), label: a.email, color: getAccountColor(a) }))].map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={scope === o.id}
                className={`du-btn${scope === o.id ? ' du-btn-primary' : ''}`}
                style={{ height: 30, padding: '0 10px', maxWidth: 240 }}
                onClick={() => setScope(o.id)}
              >
                {o.color && <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, background: o.color, flexShrink: 0 }} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
              </button>
            ))}
          </div>
          <span style={small} aria-live="polite">
            {isFetching ? 'Updating…' : updatedAt ? `Updated ${Math.max(0, Math.round((now - updatedAt) / 1000))}s ago` : ''}
          </span>
          <button
            className="du-icon-btn du-icon-btn-outline"
            aria-label="Refresh now"
            title="Refresh now"
            disabled={isFetching}
            onClick={() => ['allFiles', 'storage'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }))}
          >
            {isFetching ? <Spinner size="sm" /> : <RefreshCw size={14} />}
          </button>
        </div>

        {/* Headline numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          <Stat label="Used" value={size(used)} sub={limit ? `${fmtPct(usedPct)} of ${size(limit)}` : 'Quota unknown'} />
          <Stat label="Free" value={size(free)} sub={daysToFull != null ? `~${num(daysToFull)} days at current pace` : 'No recent growth'} />
          <Stat label="Files" value={pending ? '…' : num(stats.fileCount)} sub={`${num(stats.folderCount)} folders`} />
          <Stat label="Size of listed files" value={pending ? '…' : size(stats.totalSize)} sub={`avg ${size(stats.averageSize)} · median ${size(stats.medianSize)}`} />
          <Stat label="In trash" value={size(trash)} sub="Google Drive only · still counts" />
          <Stat label="Duplicate waste" value={pending ? '…' : size(stats.duplicateWaste)} sub={`${num(stats.duplicates.length)} duplicated files`} />
          <Stat label="Shared · starred" value={pending ? '…' : `${num(stats.shared)} · ${num(stats.starred)}`} sub={`${num(stats.cloudNative)} Google Docs (no quota)`} />
          <Stat label="Last change" value={stats.newest ? formatRelativeDate(stats.newest.modifiedTime).replace(/^about /, '') : '—'} sub={stats.newest?.name} />
        </div>

        {/* Per-drive quota detail */}
        <Section title="Drives" hint="Quota as reported by each provider. “Other” is space used outside the files listed here, such as Gmail, Google Photos, or shared drives.">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: 760 }}>
              <thead>
                <tr style={{ textAlign: 'left', ...muted }}>
                  {['Drive', 'Usage', 'Used', 'Free', 'Total', 'Files', 'Trash', 'Other', 'Largest file', 'Status'].map((h) => (
                    <th key={h} scope="col" style={{ padding: '6px 8px', fontWeight: 500, borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inScope.map((a) => {
                  const id = getAccountId(a);
                  const s = a.storage || {};
                  const st = perAccount[id];
                  const p = pct(s.used || 0, s.limit || 0);
                  const other = s.limit ? Math.max(0, (s.used || 0) - (st?.totalSize ?? s.usedInDrive ?? 0) - (s.usedInDriveTrash || 0)) : 0;
                  const expired = isAccountExpired(a);
                  return (
                    <tr key={id} style={{ ...tabular, whiteSpace: 'nowrap' }}>
                      <td style={{ padding: '10px 8px', maxWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, background: getAccountColor(a), flexShrink: 0 }} />
                          <span style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</span>
                            <span style={small}>{providerLabel(a)}{s.allocationType === 'team' ? ' · team' : ''}</span>
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', width: 140 }}>
                        <div style={{ height: 8, borderRadius: 4, background: 'var(--color-bg-overlay)', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, p)}%`, height: '100%', borderRadius: 4, background: getAccountColor(a), transition: 'width 0.4s ease' }} />
                        </div>
                        <span style={small}>{s.limit ? fmtPct(p) : '—'}</span>
                      </td>
                      <td style={{ padding: '10px 8px' }}>{size(s.used || 0)}</td>
                      <td style={{ padding: '10px 8px' }}>{s.limit ? size(s.limit - (s.used || 0)) : '—'}</td>
                      <td style={{ padding: '10px 8px' }}>{s.limit ? size(s.limit) : '—'}</td>
                      <td style={{ padding: '10px 8px' }}>{st ? `${num(st.fileCount)} / ${num(st.folderCount)} dirs` : byAccount[id]?.isError ? 'Error' : '…'}</td>
                      <td style={{ padding: '10px 8px' }}>{a.provider === 'dropbox' ? 'n/a' : size(s.usedInDriveTrash || 0)}</td>
                      <td style={{ padding: '10px 8px' }}>{s.limit ? size(other) : '—'}</td>
                      <td style={{ padding: '10px 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={st?.largest[0]?.name}>
                        {st?.largest[0] ? `${size(Number(st.largest[0].size))} · ${st.largest[0].name}` : '—'}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {expired
                          ? <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)' }}>Needs reconnect</span>
                          : s.limit ? <LevelBadge level={usageLevel(p)} /> : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 16 }}>
          <Section title={scope === 'all' ? 'Used space by drive' : 'Used space by file type'} hint="Hover a slice for its size">
            <Donut slices={donutSlices} centerLabel={scope === 'all' ? 'Total used' : 'Listed files'} centerValue={size(scope === 'all' ? used : stats.totalSize)} />
          </Section>

          <Section title="File types" hint="Share of listed bytes · file count">
            <BarList
              rows={stats.categories.filter((c) => c.count > 0).sort((a, b) => b.size - a.size)}
              extra={(r) => `${num(r.count)} files`}
            />
          </Section>
        </div>

        <Section title="Growth · last 12 months" hint="Bytes added per month, by file creation date">
          <Columns
            data={stats.months}
            valueKey="size"
            format={size}
            color={scopeColor}
            tooltip={(d) => (
              <>
                <strong>{d.label} {d.year}</strong>
                <div style={tabular}>{size(d.size)} · {num(d.count)} files</div>
              </>
            )}
          />
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 16 }}>
          <Section title="File size distribution" hint="Number of files per size range">
            <BarList
              rows={stats.sizeBuckets.map((b) => ({ ...b, color: scopeColor }))}
              valueKey="count"
              format={num}
              extra={(r) => size(r.size)}
            />
          </Section>

          <Section title="Last modified" hint="Bytes by time since last change — older data is a cleanup candidate">
            <BarList rows={stats.ageBuckets.map((b) => ({ ...b, color: scopeColor }))} extra={(r) => `${num(r.count)} files`} />
          </Section>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 16 }}>
          <Section title="Largest files" hint="Top 10 by size">
            {stats.largest.length
              ? <FileRowList files={stats.largest} accountsById={accountsById} render={(f) => <span style={tabular}>{size(Number(f.size))}</span>} />
              : <p style={{ margin: 0, ...small }}>{pending ? 'Loading…' : 'No files'}</p>}
          </Section>

          <Section title="Top extensions" hint="By total size">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', ...tabular }}>
                <thead>
                  <tr style={{ textAlign: 'left', ...muted }}>
                    {['Extension', 'Files', 'Size', 'Avg'].map((h) => (
                      <th key={h} scope="col" style={{ padding: '4px 6px', fontWeight: 500, borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.extensions.slice(0, 12).map((e) => (
                    <tr key={e.ext}>
                      <td style={{ padding: '5px 6px' }}>{e.ext === '(none)' ? e.ext : `.${e.ext}`}</td>
                      <td style={{ padding: '5px 6px' }}>{num(e.count)}</td>
                      <td style={{ padding: '5px 6px' }}>{size(e.size)}</td>
                      <td style={{ padding: '5px 6px' }}>{size(e.size / e.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        <Section
          title="Possible duplicates"
          hint={`Same name and size · ${size(stats.duplicateWaste)} could be freed by keeping one copy of each`}
        >
          {stats.duplicates.length
            ? (
              <FileRowList
                files={stats.duplicates.slice(0, 10).map((d) => d.files[0])}
                accountsById={accountsById}
                render={(f) => {
                  const d = stats.duplicates.find((x) => x.files[0] === f);
                  return <span style={{ ...tabular, textAlign: 'right' }}>{d.copies}× {size(d.size)}<br /><span style={small}>{size(d.wasted)} extra</span></span>;
                }}
              />
            )
            : <p style={{ margin: 0, ...small }}>{pending ? 'Loading…' : 'No duplicates found'}</p>}
        </Section>

        <p style={{ margin: 0, ...small }}>
          Oldest file: {stats.oldest ? `${stats.oldest.name} (${formatDateTime(stats.oldest.modifiedTime)})` : '—'}.
          {' '}Counts cover files you own and exclude trash; Google Docs, Sheets and Slides use no quota.
        </p>
      </div>
    </Modal>
  );
};
