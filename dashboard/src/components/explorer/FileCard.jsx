import React, { useState } from 'react';
import { MoreHorizontal, Star, Folder } from 'lucide-react';
import { FileIcon } from './FileIcon';
import { getAccountColor } from '../../config/constants';
import { formatFileSize, formatRelativeDate } from '../../utils/formatters';
import { isFolder } from '../../utils/helpers';

const nameStyle = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const FileCard = ({
  file,
  selected,
  onSelect,
  onClick,
  onContextMenu,
  onMenuClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const isDir = isFolder(file);
  const hasThumbnail = file.thumbnailLink && !imgError && (file.category === 'image' || file.category === 'video');
  const driveLabel = `${file.provider === 'dropbox' ? 'Dropbox' : 'Drive'} · ${file.accountEmail || ''}`;

  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) onSelect?.(file);
    else onClick?.(file);
  };
  const handleContextMenu = (e) => {
    e.preventDefault();
    onContextMenu?.(e, file);
  };
  const menuButton = (
    <button
      className="du-row-btn"
      onClick={(e) => {
        e.stopPropagation();
        onMenuClick?.(e, file);
      }}
      aria-label={`More actions for ${file.name}`}
      title="More actions"
      style={{ flexShrink: 0 }}
    >
      <MoreHorizontal size={16} />
    </button>
  );
  const checkbox = (
    <input
      type="checkbox"
      className="du-check"
      checked={selected}
      onClick={(e) => e.stopPropagation()}
      onChange={() => onSelect?.(file)}
      aria-label={`Select ${file.name}`}
    />
  );

  if (isDir) {
    return (
      <div className="du-folder-tile" data-selected={selected} onClick={handleClick} onContextMenu={handleContextMenu} title={driveLabel}>
        <span className="du-tile-lead">
          <Folder size={18} aria-hidden="true" className="du-tile-icon" style={{ color: 'var(--color-text-secondary)' }} />
          {checkbox}
        </span>
        <button type="button" style={{ ...nameStyle, flex: 1, minWidth: 0, padding: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}>
          {file.name}
        </button>
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: getAccountColor(file) }} />
        {file.starred && <Star size={13} fill="#f59e0b" color="#f59e0b" aria-label="Starred" style={{ flexShrink: 0 }} />}
        {menuButton}
      </div>
    );
  }

  return (
    <div className="du-file-card" data-selected={selected} onClick={handleClick} onContextMenu={handleContextMenu}>
      <div
        style={{
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-elevated)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        {hasThumbnail ? (
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
      </div>
      <span className="du-card-check" style={{ display: 'flex' }}>{checkbox}</span>
      {file.starred && (
        <Star size={14} fill="#f59e0b" color="#f59e0b" aria-label="Starred" style={{ position: 'absolute', top: 12, right: 12 }} />
      )}
      <div style={{ padding: '10px 6px 10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button type="button" title={file.name} style={{ ...nameStyle, display: 'block', maxWidth: '100%', padding: 0, border: 0, background: 'transparent', textAlign: 'left', cursor: 'pointer' }}>
            {file.name}
          </button>
          <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--color-text-secondary)', minWidth: 0 }} title={driveLabel}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: getAccountColor(file) }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formatFileSize(file.size)} · {formatRelativeDate(file.modifiedTime)}
            </span>
          </div>
        </div>
        {menuButton}
      </div>
    </div>
  );
};
