import React from 'react';
import { Plus, Database, ChevronRight } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';
import { GoogleDriveIcon, OneDriveIcon, DropboxIcon } from '../common/ProviderBadge';

export const StorageOverview = ({
  connectedAccounts = [],
  onConnectDrive,
  onSelectAccount,
}) => {
  // Aggregate storage metrics
  const accountsWithStorage = connectedAccounts.filter(a => a.storage);
  const totalUsed = accountsWithStorage.reduce((acc, a) => acc + (a.storage?.used || 0), 0);
  const totalLimit = accountsWithStorage.reduce((acc, a) => acc + (a.storage?.limit || 0), 0) || (15 * 1024 * 1024 * 1024); // fallback 15GB if not populated
  const totalPercent = totalLimit > 0 ? Math.min(100, Math.round((totalUsed / totalLimit) * 100)) : 0;

  return (
    <section
      className="dashboard-storage-section"
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
      }}
    >
      {/* ── Header row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 10px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            Storage Overview
          </h2>
          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
            }}
          >
            <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
              {formatFileSize(totalUsed)}
            </strong>{' '}
            of {formatFileSize(totalLimit)} used ({totalPercent}%)
          </span>
        </div>

        <button
          onClick={onConnectDrive}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background var(--transition-fast), color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-overlay)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <Plus size={12} />
          <span>Connect Drive</span>
        </button>
      </div>

      {/* ── Provider Cards Row ── */}
      <div
        className="storage-cards-grid"
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        {/* Connected Google Drive accounts */}
        {connectedAccounts.length > 0 ? (
          connectedAccounts.map((account) => {
            const used = account.storage?.used || 0;
            const limit = account.storage?.limit || (15 * 1024 * 1024 * 1024);
            const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

            return (
              <div
                key={account.email}
                onClick={() => onSelectAccount?.(account.email)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-elevated)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'border-color var(--transition-fast), background var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                title="Click to view files from this account"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <GoogleDriveIcon size={16} />
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Google Drive
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: pct > 85 ? '#ef4444' : 'var(--color-text-muted)',
                    }}
                  >
                    {pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: 4,
                    width: '100%',
                    borderRadius: 99,
                    background: 'var(--color-border)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: 99,
                      background: pct > 85 ? '#ef4444' : '#34A853',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <span style={{ truncate: true, maxWidth: '120px' }}>
                    {account.name || account.email.split('@')[0]}
                  </span>
                  <span>
                    {formatFileSize(used)} of {formatFileSize(limit)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div
            onClick={onConnectDrive}
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px dashed var(--color-border-strong)',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '0.8rem',
            }}
          >
            <GoogleDriveIcon size={18} />
            <span>Connect your first Google Drive account</span>
          </div>
        )}

        {/* Add Another Google Drive Account Card */}
        <div
          onClick={onConnectDrive}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px dashed var(--color-border)',
            background: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            minHeight: 74,
            transition: 'border-color var(--transition-fast), background var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-text-muted)';
            e.currentTarget.style.background = 'var(--color-bg-overlay)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.background = 'transparent';
          }}
          title="Connect another Google Drive account"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: '0.78rem', fontWeight: 500 }}>
            <Plus size={14} />
            <span>Add Google Drive Account</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
            Manage multiple work & personal drives
          </span>
        </div>
      </div>

      {/* Subtle provider status footer */}
      <div
        style={{
          marginTop: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.72rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          Active provider: <strong style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Google Drive</strong>
        </span>
        <span>•</span>
        <span>OneDrive & Dropbox integrations arriving in v2.1</span>
      </div>
    </section>
  );
};
