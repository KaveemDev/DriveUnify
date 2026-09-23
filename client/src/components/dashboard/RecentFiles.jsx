import React, { useState } from 'react';
import { Download, MoreHorizontal, Info, ChevronRight, Eye } from 'lucide-react';
import { FileIcon } from '../explorer/FileIcon';
import { ProviderBadge } from '../common/ProviderBadge';
import { formatFileSize, formatRelativeDate } from '../../utils/formatters';
import { isFolder } from '../../utils/helpers';

export const RecentFiles = ({
  files = [],
  onFileClick,
  onFileDetails,
  onDownload,
  onShare,
  onRename,
  onDelete,
  onContextMenu,
  onViewAllRecent,
}) => {
  const [hoveredFileId, setHoveredFileId] = useState(null);

  // Take top 3 non-folder files for a compact, non-intrusive recent section
  const recentFiles = [...files]
    .filter((f) => !f.trashed && !isFolder(f))
    .sort((a, b) => new Date(b.modifiedTime || 0) - new Date(a.modifiedTime || 0))
    .slice(0, 3);

  if (recentFiles.length === 0) {
    return null;
  }

  return (
    <section
      className="dashboard-recent-section"
      style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2
            style={{
              margin: 0,
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            Recent Activity
          </h2>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '1px 6px',
              borderRadius: 4,
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            Top 3
          </span>
        </div>

        {onViewAllRecent && (
          <button
            onClick={onViewAllRecent}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              color: 'var(--color-accent, #3b82f6)',
              fontSize: '0.73rem',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span>View all recent</span>
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 7,
          overflow: 'hidden',
          background: 'var(--color-bg-surface)',
        }}
      >
        {recentFiles.map((file) => {
          const fileKey = file.id + (file.accountEmail || '');
          const isHovered = hoveredFileId === fileKey;

          return (
            <div
              key={fileKey}
              onMouseEnter={() => setHoveredFileId(fileKey)}
              onMouseLeave={() => setHoveredFileId(null)}
              onClick={() => onFileClick?.(file)}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu?.(e, file);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 14px',
                borderBottom: '1px solid var(--color-border-subtle)',
                background: isHovered ? 'var(--color-bg-overlay)' : 'transparent',
                cursor: 'pointer',
                fontSize: '0.8rem',
                gap: 12,
                transition: 'background var(--transition-fast)',
              }}
            >
              {/* File Icon & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 5,
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileIcon category={file.category} size={14} />
                </div>
                <span
                  style={{
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={file.name}
                >
                  {file.name}
                </span>
              </div>

              {/* Metadata strip: Account, Size, Date */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  fontSize: '0.72rem',
                  color: 'var(--color-text-muted)',
                  flexShrink: 0,
                }}
              >
                <ProviderBadge provider="google_drive" accountEmail={file.accountEmail} compact />
                <span className="hidden sm:inline">{formatFileSize(file.size)}</span>
                <span className="hidden md:inline">{formatRelativeDate(file.modifiedTime)}</span>

                {/* Quick actions on hover */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity var(--transition-fast)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onFileDetails?.(file)}
                    title="View details"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Info size={11} />
                  </button>
                  <button
                    onClick={() => onDownload?.(file)}
                    title="Download"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={11} />
                  </button>
                  <button
                    onClick={(e) => onContextMenu?.(e, file)}
                    title="More actions"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <MoreHorizontal size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
