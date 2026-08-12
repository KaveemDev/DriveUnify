import { useState } from 'react';
import { Download, Pencil, Trash2, ExternalLink, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { FileIcon } from './FileIcon';
import { formatFileSize, formatRelativeDate, getMimeLabel } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';
import { getInitials } from '../../utils/formatters';
import { isFolder } from '../../utils/helpers';

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.18 } }
};

export const FileRow = ({
  file, selected, onSelect, onClick, onContextMenu,
  onDownload, onRename, onDelete, onOpenInDrive,
}) => {
  const [hovered,     setHovered]     = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const isDir     = isFolder(file);
  const acctColor = getAccountColor(file.accountEmail);

  const cellText = {
    fontSize: '0.8rem', color: 'var(--color-text-primary)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  };
  const cellMuted = {
    fontSize: '0.75rem', color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  };

  return (
    <motion.div variants={itemVariants} layout>
      <div
        className={`file-table-row ${selected ? 'selected' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) onSelect?.(file);
          else onClick?.(file);
        }}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, file); }}
      >
        {/* Checkbox */}
        <div
          style={{ width: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { e.stopPropagation(); onSelect?.(file); }}
        >
          <div style={{
            width: 15, height: 15, borderRadius: 4,
            border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
            background: selected ? 'var(--color-accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: selected || hovered ? 1 : 0,
            transition: 'opacity 130ms, background 130ms',
            cursor: 'pointer',
          }}>
            {selected && (
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                <path d="M1 3.5L3.5 6L8 1" stroke="var(--color-accent-fg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        {/* File icon */}
        <div style={{ width: 28, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <FileIcon category={file.category} size={18} />
        </div>

        {/* Name + size + type */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <div style={cellText} title={file.name}>{file.name}</div>
          <div style={{ ...cellMuted, fontSize: '0.7rem', display: 'flex', gap: 4, marginTop: 1 }}>
            {!isDir && <span>{formatFileSize(file.size)}</span>}
            {!isDir && <span>·</span>}
            <span>{getMimeLabel(file.mimeType) || (isDir ? 'Folder' : 'File')}</span>
          </div>
        </div>

        {/* Uploaded by — desktop */}
        <div style={{ width: 200, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
             className="hidden md:flex">
          {/* Mini avatar */}
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: acctColor, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontWeight: 700, color: '#fff', overflow: 'hidden',
          }}>
            {getInitials(file.accountEmail)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...cellMuted, fontSize: '0.75rem', color: 'var(--color-text-primary)' }}>
              {file.accountEmail?.split('@')[0]}
            </div>
            <div style={{ ...cellMuted, fontSize: '0.68rem' }}>
              {file.accountEmail}
            </div>
          </div>
        </div>

        {/* Last modified — desktop */}
        <div style={{ width: 100, flexShrink: 0, textAlign: 'right' }} className="hidden sm:block">
          <span style={cellMuted}>{formatRelativeDate(file.modifiedTime)}</span>
        </div>

        {/* Three-dot actions */}
        <div style={{
          width: 36, flexShrink: 0, display: 'flex', justifyContent: 'flex-end',
          opacity: hovered ? 1 : 0, transition: 'opacity 130ms',
          position: 'relative',
        }}>
          <button
            onClick={e => { e.stopPropagation(); onContextMenu?.(e, file); }}
            style={{
              width: 26, height: 26, borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)', cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
