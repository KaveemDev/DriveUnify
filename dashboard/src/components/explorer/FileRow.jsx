import React from 'react';
import { Download, MoreHorizontal, Info, Folder, Star } from 'lucide-react';
import { FileIcon } from './FileIcon';
import { getAccountColor } from '../../config/constants';
import { formatFileSize, formatRelativeDate } from '../../utils/formatters';
import { isFolder } from '../../utils/helpers';

export const FileRow = ({
  file,
  selected,
  onSelect,
  onClick,
  onContextMenu,
  onDownload,
  onFileDetails,
}) => {
  const isDir = isFolder(file);
  const driveLabel = `${file.provider === 'dropbox' ? 'Dropbox' : 'Drive'} · ${file.accountEmail || ''}`;

  return (
    <div
      className="du-table-row"
      data-selected={selected}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) onSelect?.(file);
        else onClick?.(file);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, file);
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          className="du-check"
          checked={selected}
          onChange={() => onSelect?.(file)}
          aria-label={`Select ${file.name}`}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: 8,
            background: 'var(--color-bg-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isDir ? (
            <Folder size={16} style={{ color: 'var(--color-text-secondary)' }} />
          ) : (
            <FileIcon category={file.category} size={16} />
          )}
        </span>
        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <button
            type="button"
            title={file.name}
            style={{
              padding: 0,
              border: 0,
              background: 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 'inherit',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {file.name}
          </button>
          {/* Phones hide the meta columns, so show them under the name */}
          <span className="du-only-narrow" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formatRelativeDate(file.modifiedTime)}{isDir ? '' : ` · ${formatFileSize(file.size)}`}
          </span>
        </span>
        {file.starred && <Star size={13} fill="#f59e0b" color="#f59e0b" aria-label="Starred" style={{ flexShrink: 0 }} />}
      </div>

      <div className="du-col-md" style={{ alignItems: 'center', gap: 8, minWidth: 0, color: 'var(--color-text-secondary)' }}>
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: getAccountColor(file) }} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={driveLabel}>{driveLabel}</span>
      </div>

      <div className="du-col-sm" style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {formatRelativeDate(file.modifiedTime)}
      </div>

      <div className="du-col-sm" style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {isDir ? '—' : formatFileSize(file.size)}
      </div>

      <div className="du-row-actions" onClick={(e) => e.stopPropagation()}>
        <button className="du-row-btn du-row-btn-secondary" onClick={() => onFileDetails?.(file)} aria-label={`Details for ${file.name}`} title="Details">
          <Info size={15} />
        </button>
        {!isDir && (
          <button className="du-row-btn du-row-btn-secondary" onClick={() => onDownload?.(file)} aria-label={`Download ${file.name}`} title="Download">
            <Download size={15} />
          </button>
        )}
        <button className="du-row-btn" onClick={(e) => onContextMenu?.(e, file)} aria-label={`More actions for ${file.name}`} title="More actions">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
};
