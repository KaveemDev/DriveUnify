import React from 'react';
import {
  Upload,
  FolderPlus,
  Cloud,
  ArrowLeftRight,
  Search,
  Star,
  Trash2,
  Share2,
} from 'lucide-react';

export const QuickActions = ({
  onUploadFiles,
  onCreateFolder,
  onConnectDrive,
  onTransferFiles,
  onOpenCommandPalette,
  onNavigateView,
}) => {
  const primaryActions = [
    {
      id: 'upload',
      title: 'Upload Files',
      desc: 'Add files to current folder',
      icon: Upload,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.1)',
      onClick: onUploadFiles,
      shortcut: 'U',
    },
    {
      id: 'folder',
      title: 'New Folder',
      desc: 'Create folder in Google Drive',
      icon: FolderPlus,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
      onClick: onCreateFolder,
    },
    {
      id: 'search',
      title: 'Global Search',
      desc: 'Raycast-style file lookup',
      icon: Search,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)',
      onClick: onOpenCommandPalette,
      shortcut: '⌘K',
    },
    {
      id: 'transfer',
      title: 'Transfer Files',
      desc: 'Migrate between cloud accounts',
      icon: ArrowLeftRight,
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.1)',
      onClick: onTransferFiles,
    },
    {
      id: 'connect',
      title: 'Connect Account',
      desc: 'Link another Google Drive',
      icon: Cloud,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
      onClick: onConnectDrive,
    },
  ];

  const quickFilterShortcuts = [
    { label: 'Starred Files', icon: Star, view: 'starred', color: '#F59E0B' },
    { label: 'Shared with Me', icon: Share2, view: 'shared', color: '#3B82F6' },
    { label: 'Trash Bin', icon: Trash2, view: 'trash', color: '#EF4444' },
  ];

  return (
    <section
      className="dashboard-quickactions-section"
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
      }}
    >
      {/* Header & Filter Chips */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            Quick Actions
          </h2>
        </div>

        {/* Filter shortcuts - horizontal scroll on mobile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto',
            maxWidth: '100%',
            paddingBottom: 2,
          }}
          className="scrollbar-thin"
        >
          {quickFilterShortcuts.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.view}
                onClick={() => onNavigateView?.(q.view)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.73rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-overlay)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-elevated)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                <Icon size={12} style={{ color: q.color }} />
                <span>{q.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern Prominent Cards Grid: 2 columns on mobile, fluid on desktop */}
      <div
        className="quick-actions-grid"
        style={{
          display: 'grid',
          gap: 10,
        }}
      >
        {primaryActions.map((act, idx) => {
          const Icon = act.icon;
          const isOddLast = idx === primaryActions.length - 1 && primaryActions.length % 2 !== 0;
          return (
            <div
              key={act.id}
              onClick={act.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && act.onClick?.()}
              className={`quick-action-card ${isOddLast ? 'col-span-last-mobile' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '11px 13px',
                borderRadius: 9,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                position: 'relative',
                minWidth: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: act.bg,
                  color: act.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={17} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {act.title}
                  </span>
                  {act.shortcut && (
                    <kbd
                      className="hidden sm:inline-block"
                      style={{
                        padding: '1px 4px',
                        borderRadius: 3,
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.62rem',
                        color: 'var(--color-text-muted)',
                        fontWeight: 600,
                        marginLeft: 4,
                      }}
                    >
                      {act.shortcut}
                    </kbd>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 2,
                  }}
                >
                  {act.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
