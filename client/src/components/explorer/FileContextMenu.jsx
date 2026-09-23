import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Pencil, Star, StarOff, Trash2,
  Trash, ExternalLink, Copy, Eye, CopyPlus, Info, RotateCcw
} from 'lucide-react';
import { isFolder, isGoogleAppsFile, copyToClipboard, openInGoogleDrive } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const FileContextMenu = ({
  file,
  position,
  open,
  onClose,
  onPreview,
  onDetails,
  onRename,
  onDelete,
  onPermanentDelete,
  onToggleStar,
  onDownload,
  onCopyToDrive,
  onRestore,
  connectedAccounts = [],
}) => {
  const menuRef = useRef(null);
  const [activeFile, setActiveFile] = useState(file);
  const [menuPos, setMenuPos] = useState({ top: -9999, left: -9999 });

  useEffect(() => {
    if (open && file && position) {
      setActiveFile(file);

      let top = position.y;
      let left = position.x;
      const menuWidth = 220;
      const menuHeight = 360;

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

  const currentFile = open ? file : activeFile;
  if (!currentFile && !open) return null;

  const isDir = currentFile ? isFolder(currentFile) : false;
  const isGApp = currentFile ? isGoogleAppsFile(currentFile.mimeType) : false;

  const MenuItem = ({ icon: Icon, label, onClick, color, divider }) => (
    <>
      <button
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          width: '100%',
          padding: '6px 10px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: color || 'var(--color-text-primary)',
          fontSize: '0.8rem',
          fontWeight: 500,
          textAlign: 'left',
          borderRadius: 6,
          transition: 'background var(--transition-fast), color var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = color ? 'rgba(239, 68, 68, 0.08)' : 'var(--color-bg-overlay)';
          e.currentTarget.style.color = color || 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = color || 'var(--color-text-primary)';
        }}
      >
        <Icon size={14} style={{ color: color || 'var(--color-text-secondary)', flexShrink: 0 }} />
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
      </button>
      {divider && <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />}
    </>
  );

  return createPortal(
    <AnimatePresence>
      {open && currentFile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
            width: 215,
            padding: 4,
            borderRadius: 8,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-strong)',
            boxShadow: 'var(--shadow-popup)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            style={{
              padding: '6px 10px 6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentFile.name}
          </div>

          <div style={{ height: 1, background: 'var(--color-border)', margin: '0 -4px 4px' }} />

          {!isDir && (
            <MenuItem
              icon={Eye}
              label="Preview"
              onClick={() => {
                onPreview?.(currentFile);
                onClose?.();
              }}
            />
          )}

          <MenuItem
            icon={Info}
            label="Details"
            onClick={() => {
              onDetails?.(currentFile);
              onClose?.();
            }}
          />

          {!isGApp && !isDir && (
            <MenuItem
              icon={Download}
              label="Download"
              onClick={() => {
                onDownload?.(currentFile);
                onClose?.();
              }}
            />
          )}

          <MenuItem
            icon={ExternalLink}
            label="Open in Google Drive"
            onClick={() => {
              openInGoogleDrive(currentFile);
              onClose?.();
            }}
          />

          <MenuItem
            icon={Copy}
            label="Copy share link"
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
              icon={CopyPlus}
              label="Copy to Drive →"
              divider
              onClick={() => {
                onCopyToDrive?.(currentFile);
                onClose?.();
              }}
            />
          )}

          <MenuItem
            icon={Pencil}
            label="Rename"
            onClick={() => {
              onRename?.(currentFile);
              onClose?.();
            }}
          />

          <MenuItem
            icon={currentFile.starred ? StarOff : Star}
            label={currentFile.starred ? 'Unstar' : 'Star'}
            divider
            onClick={() => {
              onToggleStar?.(currentFile);
              onClose?.();
            }}
          />

          {currentFile.trashed ? (
            <>
              <MenuItem
                icon={RotateCcw}
                label="Restore File"
                color="#10b981"
                onClick={() => {
                  onRestore?.(currentFile);
                  onClose?.();
                }}
              />
              <MenuItem
                icon={Trash}
                label="Delete Permanently"
                color="#ef4444"
                onClick={() => {
                  onPermanentDelete?.(currentFile);
                  onClose?.();
                }}
              />
            </>
          ) : (
            <>
              <MenuItem
                icon={Trash2}
                label="Move to Trash"
                color="#ef4444"
                onClick={() => {
                  onDelete?.(currentFile);
                  onClose?.();
                }}
              />
              <MenuItem
                icon={Trash}
                label="Delete Permanently"
                color="#ef4444"
                onClick={() => {
                  onPermanentDelete?.(currentFile);
                  onClose?.();
                }}
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
