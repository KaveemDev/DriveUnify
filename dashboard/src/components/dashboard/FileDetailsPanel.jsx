import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Link2, Pencil, Trash2, Star, ExternalLink, Folder } from 'lucide-react';
import { FileIcon } from '../explorer/FileIcon';
import { getAccountColor } from '../../config/constants';
import { formatFileSize, formatRelativeDate, formatAbsoluteDate, getMimeLabel } from '../../utils/formatters';
import { isFolder, copyToClipboard, openInGoogleDrive } from '../../utils/helpers';
import toast from 'react-hot-toast';

const tileStyle = {
  height: 60,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: '0 4px',
  borderRadius: 10,
  fontSize: '0.75rem',
  fontWeight: 500,
};

const Property = ({ label, children }) => (
  <>
    <dt style={{ color: 'var(--color-text-secondary)' }}>{label}</dt>
    <dd style={{ margin: 0, color: 'var(--color-text-primary)', minWidth: 0, overflowWrap: 'anywhere' }}>{children}</dd>
  </>
);

export const FileDetailsPanel = ({
  file,
  onClose,
  onDownload,
  onRename,
  onDelete,
  onToggleStar,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!file) return null;

  const isDir = isFolder(file);
  const isDropbox = file.provider === 'dropbox';

  return (
    <AnimatePresence>
      <motion.aside
        className="du-inspector"
        aria-labelledby="details-heading"
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 24, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 340,
          maxWidth: '100%',
          borderLeft: '1px solid var(--color-border)',
          background: 'var(--color-bg-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexShrink: 0,
          zIndex: 25,
        }}
      >
        <div style={{ padding: '14px 16px 14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 id="details-heading" style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            Details
          </h2>
          <button className="du-icon-btn" onClick={onClose} aria-label="Close details" title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }} className="scrollbar-thin">
          <div
            style={{
              height: 180,
              flexShrink: 0,
              borderRadius: 14,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {file.thumbnailLink ? (
              <img src={file.thumbnailLink} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : isDir ? (
              <Folder size={44} style={{ color: 'var(--color-text-secondary)' }} aria-hidden="true" />
            ) : (
              <FileIcon category={file.category} size={44} />
            )}
          </div>

          <div>
            <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35, color: 'var(--color-text-primary)', overflowWrap: 'anywhere' }}>
              {file.name}
            </h3>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-text-secondary)', minWidth: 0 }}>
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: getAccountColor(file) }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isDropbox ? 'Dropbox' : 'Google Drive'} · {file.accountEmail}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isDir ? 3 : 4}, minmax(0, 1fr))`, gap: 8 }}>
            <button
              className="du-btn"
              style={tileStyle}
              onClick={() => {
                copyToClipboard(`${window.location.origin}/dashboard?share=${file.id}`);
                toast.success('Share link copied');
              }}
            >
              <Link2 size={16} /> Copy link
            </button>
            {!isDir && (
              <button className="du-btn" style={tileStyle} onClick={() => onDownload?.(file)}>
                <Download size={16} /> Download
              </button>
            )}
            <button className="du-btn" style={tileStyle} onClick={() => onRename?.(file)}>
              <Pencil size={16} /> Rename
            </button>
            <button
              className="du-btn"
              style={{ ...tileStyle, color: file.starred ? 'var(--color-warning)' : undefined }}
              onClick={() => onToggleStar?.(file)}
              aria-pressed={!!file.starred}
            >
              <Star size={16} fill={file.starred ? 'currentColor' : 'none'} /> {file.starred ? 'Starred' : 'Star'}
            </button>
          </div>

          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '88px minmax(0, 1fr)', gap: '12px 12px', fontSize: '0.8125rem' }}>
            <Property label="Type">{getMimeLabel(file.mimeType) || (isDir ? 'Folder' : 'File')}</Property>
            {!isDir && <Property label="Size">{formatFileSize(file.size)}</Property>}
            <Property label="Modified">{formatRelativeDate(file.modifiedTime)}</Property>
            {file.createdTime && <Property label="Created">{formatAbsoluteDate(file.createdTime)}</Property>}
            <Property label="Location">{file.parents?.[0] ? 'In a folder' : isDropbox ? 'Dropbox root' : 'My Drive'}</Property>
          </dl>
        </div>

        <div style={{ padding: '16px 24px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
          {!isDropbox && (
            <button className="du-btn du-btn-primary du-btn-lg" style={{ flex: 1 }} onClick={() => openInGoogleDrive(file)}>
              <ExternalLink size={15} /> Open in Google Drive
            </button>
          )}
          <button
            className="du-btn du-btn-lg"
            style={{ flex: isDropbox ? 1 : '0 0 auto', color: '#ef4444' }}
            onClick={() => onDelete?.(file)}
            aria-label="Move to trash"
            title="Move to trash"
          >
            <Trash2 size={15} />
            {isDropbox && 'Move to trash'}
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
