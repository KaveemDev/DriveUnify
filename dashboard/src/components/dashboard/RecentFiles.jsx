import React, { useState } from 'react';
import { FileIcon } from '../explorer/FileIcon';
import { formatRelativeDate } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';
import { isFolder } from '../../utils/helpers';

const RecentCard = ({ file, onFileClick, onContextMenu }) => {
  const [imgError, setImgError] = useState(false);
  const showThumb = file.thumbnailLink && !imgError && (file.category === 'image' || file.category === 'video');
  const driveName = file.provider === 'dropbox' ? 'Dropbox' : file.accountEmail?.split('@')[0];

  return (
    <button
      className="du-card du-recent-card"
      onClick={() => onFileClick?.(file)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, file);
      }}
      title={file.name}
    >
      <span
        style={{
          height: 104,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-elevated)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        {showThumb ? (
          <img
            src={file.thumbnailLink}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <FileIcon category={file.category} size={32} />
        )}
      </span>
      <span style={{ width: '100%', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {file.name}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--color-text-secondary)', minWidth: 0 }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: getAccountColor(file) }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formatRelativeDate(file.modifiedTime)} · {driveName}
          </span>
        </span>
      </span>
    </button>
  );
};

export const RecentFiles = ({ files = [], onFileClick, onContextMenu, onViewAllRecent }) => {
  const recentFiles = [...files]
    .filter((f) => !f.trashed && !isFolder(f))
    .sort((a, b) => new Date(b.modifiedTime || 0) - new Date(a.modifiedTime || 0))
    .slice(0, 4);

  if (recentFiles.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 id="recent-heading" className="du-section-title">Jump back in</h2>
        {onViewAllRecent && (
          <button className="du-link-btn" onClick={onViewAllRecent}>View all recent</button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {recentFiles.map((file) => (
          <RecentCard
            key={file.id + (file.accountEmail || '')}
            file={file}
            onFileClick={onFileClick}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </section>
  );
};
