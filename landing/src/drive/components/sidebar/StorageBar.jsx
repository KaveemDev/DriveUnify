import { useSelector } from 'react-redux';
import { formatFileSize } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';

export const StorageBar = () => {
  const { connectedAccounts } = useSelector(s => s.drive);
  const accountsWithStorage = connectedAccounts.filter(a => a.storage);
  if (accountsWithStorage.length === 0) return null;

  const totalUsed  = accountsWithStorage.reduce((s, a) => s + (a.storage?.used  || 0), 0);
  const totalLimit = accountsWithStorage.reduce((s, a) => s + (a.storage?.limit || 0), 0);
  const totalPct   = totalLimit > 0 ? Math.min(100, Math.round((totalUsed / totalLimit) * 100)) : 0;

  const segments = accountsWithStorage.map(a => ({
    email:   a.email,
    percent: totalLimit > 0 ? ((a.storage?.used || 0) / totalLimit) * 100 : 0,
    color:   getAccountColor(a.email),
  }));

  return (
    <div style={{
      padding: '10px 12px',
      borderTop: '1px solid var(--color-border)',
    }}>
      {/* Label row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Storage
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          {totalPct}%
        </span>
      </div>

      {/* Segmented bar */}
      <div style={{
        height: 4, borderRadius: 99,
        background: 'var(--color-border-strong)',
        display: 'flex', overflow: 'hidden',
      }}>
        {segments.map((seg, i) => (
          <div
            key={seg.email}
            title={`${seg.email}: ${Math.round(seg.percent)}%`}
            style={{
              height: '100%', width: `${seg.percent}%`,
              background: seg.color,
              marginLeft: i > 0 && seg.percent > 0 ? '1px' : 0,
              transition: 'width 0.5s',
            }}
          />
        ))}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: 5, fontSize: '0.65rem', color: 'var(--color-text-muted)',
      }}>
        {formatFileSize(totalUsed)} of {formatFileSize(totalLimit)} used
      </div>
    </div>
  );
};
