import React, { useState } from 'react';
import { Plus, ArrowLeftRight } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';
import { getAccountId } from '../../utils/helpers';
import { getSpaceSuggestion, isAccountExpired } from '../../utils/storage';

const providerLabel = (account) => (account.provider === 'dropbox' ? 'Dropbox' : 'Drive');
export const StorageOverview = ({
  connectedAccounts = [],
  onConnectDrive,
  onSelectAccount,
  onTransferFiles,
}) => {
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  const withStorage = connectedAccounts.filter((a) => a.storage?.limit > 0);
  const totalUsed = withStorage.reduce((sum, a) => sum + (a.storage.used || 0), 0);
  const totalLimit = withStorage.reduce((sum, a) => sum + a.storage.limit, 0);
  const totalFree = Math.max(0, totalLimit - totalUsed);
  const suggestion = suggestionDismissed ? null : getSpaceSuggestion(connectedAccounts);

  if (connectedAccounts.length === 0) {
    return (
      <section className="du-card" style={{ padding: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: '1 1 280px' }}>
          <h2 className="du-section-title">Connect your first drive</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Add Google Drive or Dropbox to see all your storage in one place.
          </p>
        </div>
        <button className="du-btn du-btn-primary" onClick={onConnectDrive}>
          <Plus size={15} /> Connect drive
        </button>
      </section>
    );
  }

  const ariaSummary = withStorage
    .map((a) => `${providerLabel(a)} ${a.email} ${formatFileSize(a.storage.used)}`)
    .concat(`${formatFileSize(totalFree)} free`)
    .join(', ');

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <section
        aria-labelledby="storage-heading"
        className="du-card"
        style={{ flex: '2 1 480px', minWidth: 0, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2 id="storage-heading" style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Unified storage
            </h2>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '2.25rem', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {formatFileSize(totalUsed)}
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>of {formatFileSize(totalLimit)} used</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Free across drives</div>
              <div style={{ marginTop: 6, fontSize: '1.25rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatFileSize(totalFree)}
              </div>
            </div>
            <button className="du-icon-btn du-icon-btn-outline" onClick={onConnectDrive} aria-label="Connect another drive" title="Connect another drive">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {totalLimit > 0 && (
          <div role="img" aria-label={`Storage by drive: ${ariaSummary}`} style={{ display: 'flex', gap: 3, height: 12 }}>
            {withStorage.map((a) => (
              <div
                key={getAccountId(a)}
                style={{ flex: `${a.storage.used} 1 0`, minWidth: a.storage.used > 0 ? 4 : 0, borderRadius: 3, background: getAccountColor(a) }}
              />
            ))}
            <div style={{ flex: `${totalFree} 1 0`, borderRadius: 3, background: 'var(--color-bg-overlay)' }} />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
          {connectedAccounts.map((a) => {
            const expired = isAccountExpired(a);
            return (
              <button
                key={getAccountId(a)}
                onClick={() => onSelectAccount?.(getAccountId(a))}
                className="du-btn"
                style={{ height: 'auto', justifyContent: 'flex-start', alignItems: 'flex-start', padding: '8px 10px', border: 0, textAlign: 'left', gap: 10 }}
                title="Show files from this drive"
              >
                <span aria-hidden="true" style={{ marginTop: 6, width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: getAccountColor(a) }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: expired ? 'var(--color-warning)' : undefined }}>
                    {expired
                      ? 'Needs reconnect'
                      : a.storage?.limit > 0
                        ? `${formatFileSize(a.storage.used)} of ${formatFileSize(a.storage.limit)}`
                        : 'Storage unknown'}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {providerLabel(a)} · {a.email}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {suggestion && (
        <section
          aria-labelledby="suggestion-heading"
          className="du-card"
          style={{ flex: '1 1 300px', minWidth: 0, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            <ArrowLeftRight size={15} aria-hidden="true" />
            <span>Suggestion</span>
          </div>
          <h2 id="suggestion-heading" style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>
            {suggestion.from.email} is {suggestion.usedPercent}% full
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', overflowWrap: 'anywhere' }}>
            Move large files to {providerLabel(suggestion.to)} · {suggestion.to.email}, which has {formatFileSize(suggestion.freeOnTarget)} free.
          </p>
          <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button className="du-btn du-btn-primary" onClick={onTransferFiles}>Move files</button>
            <button className="du-btn" onClick={() => setSuggestionDismissed(true)}>Not now</button>
          </div>
        </section>
      )}
    </div>
  );
};
