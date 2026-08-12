import { useState } from 'react';
import { MoreHorizontal, Star, Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import { FileIcon } from './FileIcon';
import { formatFileSize, formatRelativeDate } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';
import { isFolder } from '../../utils/helpers';

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22 } }
};

export const FileCard = ({
  file, selected, onSelect, onClick, onContextMenu, onMenuClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered]   = useState(false);
  const isDir       = isFolder(file);
  const hasThumbnail = file.thumbnailLink && !imgError;
  const acctColor   = getAccountColor(file.accountEmail);

  return (
    <motion.div variants={itemVariants} layout>
      <div
        className="recmod-card"
        style={{
          border: selected
            ? '1.5px solid var(--color-accent)'
            : '1px solid var(--color-border)',
          background: selected ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
          position: 'relative',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) onSelect?.(file);
          else onClick?.(file);
        }}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, file); }}
      >
        {/* File type icon */}
        <div style={{
          width: 34, height: 34, borderRadius: 7,
          background: 'var(--color-bg-overlay)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {hasThumbnail ? (
            <img
              src={file.thumbnailLink} alt={file.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7 }}
              onError={() => setImgError(true)}
            />
          ) : (
            <FileIcon category={file.category} size={20} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.8rem', fontWeight: 500,
            color: 'var(--color-text-primary)', lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }} title={file.name}>
            {file.name}
          </div>
          <div style={{
            fontSize: '0.7rem', color: 'var(--color-text-muted)',
            display: 'flex', gap: 4, alignItems: 'center', marginTop: 1,
          }}>
            {!isDir && <span>{formatFileSize(file.size)}</span>}
            {!isDir && <span>·</span>}
            <span style={{ textTransform: 'lowercase' }}>{file.category || (isDir ? 'folder' : 'file')}</span>
          </div>
        </div>

        {/* Star */}
        {file.starred && (
          <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ flexShrink: 0 }} />
        )}

        {/* Three-dot menu */}
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); onMenuClick?.(e, file); }}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 22, height: 22, borderRadius: 5,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)', cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MoreHorizontal size={13} />
          </button>
        )}

        {/* Account dot */}
        <div
          title={file.accountEmail}
          style={{
            position: 'absolute', right: hovered ? 36 : 8, bottom: 7,
            width: 6, height: 6, borderRadius: '50%',
            background: acctColor, transition: 'right 130ms',
          }}
        />
      </div>
    </motion.div>
  );
};
