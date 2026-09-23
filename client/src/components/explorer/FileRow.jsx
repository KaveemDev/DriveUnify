import React, { useState } from 'react';
import {
  Download, Pencil, Trash2, MoreHorizontal, Info,
  Folder, Check, Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FileIcon } from './FileIcon';
import { ProviderBadge } from '../common/ProviderBadge';
import { formatFileSize, formatRelativeDate, getMimeLabel } from '../../utils/formatters';
import { isFolder, copyToClipboard } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const FileRow = ({
  file,
  selected,
  onSelect,
  onClick,
  onContextMenu,
  onDownload,
  onRename,
  onDelete,
  onFileDetails,
}) => {
  const [hovered, setHovered] = useState(false);
  const isDir = isFolder(file);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          onSelect?.(file);
        } else {
          onClick?.(file);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, file);
      }}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 30px minmax(200px, 3fr) minmax(130px, 1.2fr) minmax(100px, 1fr) minmax(80px, 0.8fr) 120px',
        alignItems: 'center',
        padding: '0 16px',
        height: 42,
        borderBottom: '1px solid var(--color-border-subtle)',
        background: selected
          ? 'var(--color-bg-elevated)'
          : hovered
          ? 'var(--color-bg-overlay)'
          : 'transparent',
        cursor: 'pointer',
        fontSize: '0.8125rem',
        transition: 'background var(--transition-fast)',
        userSelect: 'none',
      }}
      className="file-table-row-grid"
    >
      {/* 1. Checkbox */}
      <div
        style={{ display: 'flex', alignItems: 'center' }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(file);
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
            background: selected ? 'var(--color-accent)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: selected || hovered ? 1 : 0,
            transition: 'opacity var(--transition-fast), background var(--transition-fast)',
            cursor: 'pointer',
          }}
        >
          {selected && <Check size={10} strokeWidth={2.5} color="var(--color-accent-fg)" />}
        </div>
      </div>

      {/* 2. File Icon */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {isDir ? (
          <Folder size={17} fill="#f59e0b" color="#f59e0b" />
        ) : (
          <FileIcon category={file.category} size={17} />
        )}
      </div>

      {/* 3. File Name */}
      <div style={{ minWidth: 0, paddingRight: 12 }}>
        <div
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
        </div>
      </div>

      {/* 4. Provider / Account */}
      <div className="hidden md:block">
        <ProviderBadge
          provider="google_drive"
          accountEmail={file.accountEmail}
          compact
        />
      </div>

      {/* 5. Last Modified */}
      <div
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.78rem',
          whiteSpace: 'nowrap',
        }}
        className="hidden sm:block"
      >
        {formatRelativeDate(file.modifiedTime)}
      </div>

      {/* 6. Size */}
      <div
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.78rem',
          whiteSpace: 'nowrap',
        }}
        className="hidden sm:block"
      >
        {isDir ? '—' : formatFileSize(file.size)}
      </div>

      {/* 7. Hover Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 3,
          opacity: hovered ? 1 : 0,
          transition: 'opacity var(--transition-fast)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onFileDetails?.(file)}
          title="Details"
          style={{
            width: 24,
            height: 24,
            borderRadius: 5,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Info size={12} />
        </button>

        {!isDir && (
          <button
            onClick={() => onDownload?.(file)}
            title="Download"
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Download size={12} />
          </button>
        )}

        <button
          onClick={() => {
            const link = `${window.location.origin}/dashboard?share=${file.id}`;
            copyToClipboard(link);
            toast.success('Share link copied');
          }}
          title="Copy link"
          style={{
            width: 24,
            height: 24,
            borderRadius: 5,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Share2 size={12} />
        </button>

        <button
          onClick={(e) => onContextMenu?.(e, file)}
          title="More actions"
          style={{
            width: 24,
            height: 24,
            borderRadius: 5,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <MoreHorizontal size={13} />
        </button>
      </div>
    </div>
  );
};
