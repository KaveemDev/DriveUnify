import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Share2, Pencil, Trash2, Star, StarOff,
  ExternalLink, HardDrive, Calendar, Database, User, Shield
} from 'lucide-react';
import { FileIcon } from '../explorer/FileIcon';
import { ProviderBadge } from '../common/ProviderBadge';
import { formatFileSize, formatRelativeDate, getMimeLabel } from '../../utils/formatters';
import { isFolder, copyToClipboard, openInGoogleDrive } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const FileDetailsPanel = ({
  file,
  onClose,
  onDownload,
  onRename,
  onDelete,
  onToggleStar,
}) => {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!file) return null;

  const isDir = isFolder(file);

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 320,
          borderLeft: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexShrink: 0,
          zIndex: 25,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            File Details
          </span>
          <button
            onClick={onClose}
            title="Close details (Esc)"
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={14} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="scrollbar-thin">
          {/* Preview Box */}
          <div
            style={{
              width: '100%',
              height: 140,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: 16,
              position: 'relative',
            }}
          >
            {file.thumbnailLink ? (
              <img
                src={file.thumbnailLink}
                alt={file.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <FileIcon category={file.category} size={48} />
            )}
            {file.starred && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(0,0,0,0.5)',
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
              </div>
            )}
          </div>

          {/* File Name */}
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: '0.925rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              wordBreak: 'break-word',
              lineHeight: 1.35,
            }}
          >
            {file.name}
          </h3>

          {/* Quick Action Buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6,
              marginBottom: 18,
            }}
          >
            {!isDir && (
              <button
                onClick={() => onDownload?.(file)}
                title="Download"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 4px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.675rem',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-elevated)')}
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            )}

            <button
              onClick={() => {
                const link = `${window.location.origin}/dashboard?share=${file.id}`;
                copyToClipboard(link);
                toast.success('Share link copied');
              }}
              title="Copy share link"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 4px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.675rem',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-elevated)')}
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>

            <button
              onClick={() => onRename?.(file)}
              title="Rename"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 4px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.675rem',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-elevated)')}
            >
              <Pencil size={14} />
              <span>Rename</span>
            </button>

            <button
              onClick={() => onToggleStar?.(file)}
              title={file.starred ? 'Unstar' : 'Star'}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 4px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                color: file.starred ? '#f59e0b' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.675rem',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-bg-elevated)')}
            >
              {file.starred ? <StarOff size={14} /> : <Star size={14} />}
              <span>{file.starred ? 'Starred' : 'Star'}</span>
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--color-border)', margin: '14px 0' }} />

          {/* Detailed Metadata Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--color-text-muted)',
              }}
            >
              Properties
            </span>

            {/* Provider */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Provider</span>
              <ProviderBadge provider="google_drive" accountEmail={file.accountEmail} compact />
            </div>

            {/* Account */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Account</span>
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-text-primary)',
                  fontWeight: 500,
                  maxWidth: 160,
                  textAlign: 'right',
                  truncate: true,
                }}
                title={file.accountEmail}
              >
                {file.accountEmail}
              </span>
            </div>

            {/* Type */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Type</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {getMimeLabel(file.mimeType) || (isDir ? 'Folder' : 'File')}
              </span>
            </div>

            {/* Size */}
            {!isDir && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Size</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {formatFileSize(file.size)}
                </span>
              </div>
            )}

            {/* Modified */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Modified</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {formatRelativeDate(file.modifiedTime)}
              </span>
            </div>

            {/* Location */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Location</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {file.parents?.[0] ? 'Subfolder' : 'My Drive'}
              </span>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--color-border)', margin: '16px 0' }} />

          {/* External Action */}
          <button
            onClick={() => openInGoogleDrive(file)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: 8,
              transition: 'background var(--transition-fast), color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-overlay)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <ExternalLink size={13} />
            <span>Open in Google Drive</span>
          </button>

          {/* Delete Action */}
          <button
            onClick={() => onDelete?.(file)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.05)',
              color: '#ef4444',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)')}
          >
            <Trash2 size={13} />
            <span>Move to Trash</span>
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
