import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Pencil, Star, StarOff, Trash2,
  Trash, ExternalLink, Copy, Eye, CopyPlus,
} from 'lucide-react';
import { isFolder, isGoogleAppsFile, copyToClipboard, openInGoogleDrive } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const FileContextMenu = ({
  file,
  position,
  open,
  onClose,
  onPreview,
  onRename,
  onDelete,
  onPermanentDelete,
  onToggleStar,
  onDownload,
  onCopyToDrive,
  connectedAccounts = [],
}) => {
  const menuRef = useRef(null);

  // Keep a ref to the last known file so we can animate the exit when file becomes null
  const [activeFile, setActiveFile] = useState(file);
  const [menuPos, setMenuPos] = useState({ top: -9999, left: -9999 });

  useEffect(() => {
    if (open && file && position) {
      setActiveFile(file);
      
      // Calculate position keeping it within viewport
      let top = position.y;
      let left = position.x;
      const menuWidth = 220;
      const menuHeight = 350; // Approximated height

      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (top + menuHeight > window.innerHeight) {
        top = window.innerHeight - menuHeight - 8;
      }
      setMenuPos({ top, left });
    }
  }, [open, file, position]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    const handleEsc = (e) => {
      if (open && e.key === 'Escape') onClose?.();
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, onClose]);

  // Use the activeFile (last known file) to render during the exit animation
  const currentFile = open ? file : activeFile;

  if (!currentFile && !open) return null;

  const isDir = currentFile ? isFolder(currentFile) : false;
  const isGApp = currentFile ? isGoogleAppsFile(currentFile.mimeType) : false;

  const MenuItem = ({ icon: Icon, label, onClick, color, divider }) => (
    <>
      <button
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '7px 12px', border: 'none',
          background: 'transparent', cursor: 'pointer',
          color: color || 'var(--color-text-primary)',
          fontSize: '0.81rem', fontWeight: 500, textAlign: 'left',
          borderRadius: 6, transition: 'background 100ms, color 100ms',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = color ? `rgba(239, 68, 68, 0.08)` : 'var(--color-bg-overlay)';
          e.currentTarget.style.color = color || 'var(--color-text-primary)';
          const icon = e.currentTarget.querySelector('svg');
          if (icon) icon.style.color = color || 'var(--color-text-primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = color || 'var(--color-text-primary)';
          const icon = e.currentTarget.querySelector('svg');
          if (icon) icon.style.color = color || 'var(--color-text-secondary)';
        }}
      >
        <Icon size={15} style={{ color: color || 'var(--color-text-secondary)', flexShrink: 0, transition: 'color 100ms' }} />
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </button>
      {divider && <div style={{ height: 1, background: 'var(--color-border)', margin: '4px -4px' }} />}
    </>
  );

  return createPortal(
    <AnimatePresence>
      {open && currentFile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
            width: 220,
            padding: 4,
            borderRadius: 10,
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-popup)',
            display: 'flex', flexDirection: 'column',
          }}
          onContextMenu={e => e.preventDefault()}
        >
          <div style={{
            padding: '6px 12px 8px',
            fontSize: '0.72rem', fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {currentFile.name}
          </div>
          
          <div style={{ height: 1, background: 'var(--color-border)', margin: '0 -4px 4px' }} />

          {!isDir && (
            <MenuItem
              icon={Eye} label="Preview"
              onClick={() => { onPreview?.(currentFile); onClose?.(); }}
            />
          )}
          {!isGApp && !isDir && (
            <MenuItem
              icon={Download} label="Download"
              onClick={() => { onDownload?.(currentFile); onClose?.(); }}
            />
          )}
          <MenuItem
            icon={ExternalLink} label="Open in Drive"
            onClick={() => { openInGoogleDrive(currentFile); onClose?.(); }}
          />
          <MenuItem
            icon={Copy} label="Copy share link"
            divider
            onClick={() => {
              const shareLink = `${window.location.origin}/dashboard?share=${currentFile.id}`;
              copyToClipboard(shareLink);
              toast.success('Share link copied');
              onClose?.();
            }}
          />

          {connectedAccounts.length >= 2 && (
            <MenuItem
              icon={CopyPlus} label="Copy to Drive →"
              divider
              onClick={() => { onCopyToDrive?.(currentFile); onClose?.(); }}
            />
          )}

          <MenuItem
            icon={Pencil} label="Rename"
            onClick={() => { onRename?.(currentFile); onClose?.(); }}
          />
          <MenuItem
            icon={currentFile.starred ? StarOff : Star} label={currentFile.starred ? 'Unstar' : 'Star'}
            divider
            onClick={() => { onToggleStar?.(currentFile); onClose?.(); }}
          />

          <MenuItem
            icon={Trash2} label="Move to Trash" color="#ef4444"
            onClick={() => { onDelete?.(currentFile); onClose?.(); }}
          />
          <MenuItem
            icon={Trash} label="Delete Permanently" color="#ef4444"
            onClick={() => { onPermanentDelete?.(currentFile); onClose?.(); }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
