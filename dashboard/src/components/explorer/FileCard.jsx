import React, { useState } from 'react';
import { MoreHorizontal, Star, Folder, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { FileIcon } from './FileIcon';
import { CloudProviderIcon } from '../common/ProviderBadge';
import { formatFileSize, formatRelativeDate } from '../../utils/formatters';
import { isFolder } from '../../utils/helpers';

export const FileCard = ({
  file,
  selected,
  onSelect,
  onClick,
  onContextMenu,
  onMenuClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isDir = isFolder(file);
  const hasThumbnail = file.thumbnailLink && !imgError && (file.category === 'image' || file.category === 'video');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.16 }}
    >
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
          position: 'relative',
          borderRadius: 8,
          border: selected
            ? '1.5px solid var(--color-accent)'
            : '1px solid var(--color-border)',
          background: selected
            ? 'var(--color-bg-elevated)'
            : hovered
            ? 'var(--color-bg-elevated)'
            : 'var(--color-bg-surface)',
          padding: 10,
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          userSelect: 'none',
        }}
      >
        {/* Top Header Row inside Card: Selection checkbox, Type/Thumbnail, More menu */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          {/* Checkbox (visible on hover or when selected) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(file);
            }}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
              background: selected ? 'var(--color-accent)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: selected || hovered ? 1 : 0,
              transition: 'opacity var(--transition-fast), background var(--transition-fast)',
            }}
          >
            {selected && <Check size={11} strokeWidth={2.5} color="var(--color-accent-fg)" />}
          </div>

          <div style={{ flex: 1 }} />

          {/* Star if starred */}
          {file.starred && (
            <Star size={13} fill="#f59e0b" color="#f59e0b" style={{ flexShrink: 0 }} />
          )}

          {/* 3-dot context menu trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick?.(e, file);
            }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: hovered ? 1 : 0,
              transition: 'opacity var(--transition-fast)',
            }}
            title="More actions"
          >
            <MoreHorizontal size={12} />
          </button>
        </div>

        {/* Thumbnail or Center Icon */}
        {hasThumbnail ? (
          <div
            style={{
              width: '100%',
              height: 80,
              borderRadius: 6,
              overflow: 'hidden',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={file.thumbnailLink}
              alt={file.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div
            style={{
              height: isDir ? 44 : 52,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 4px',
            }}
          >
            <div
              style={{
                width: isDir ? 34 : 36,
                height: isDir ? 34 : 36,
                borderRadius: 7,
                background: isDir ? 'rgba(245, 158, 11, 0.12)' : 'var(--color-bg-overlay)',
                border: isDir ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isDir ? (
                <Folder size={18} fill="#f59e0b" color="#f59e0b" />
              ) : (
                <FileIcon category={file.category} size={18} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={file.name}
              >
                {file.name}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-text-muted)',
                  marginTop: 2,
                }}
              >
                {isDir ? 'Folder' : (file.category || 'File')}
              </div>
            </div>
          </div>
        )}

        {/* If thumbnail was shown above, show name here */}
        {hasThumbnail && (
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={file.name}
          >
            {file.name}
          </div>
        )}

        {/* Bottom Footer: Size/Modified + Provider Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 4,
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: '0.7rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>
            {isDir
              ? formatRelativeDate(file.modifiedTime)
              : formatFileSize(file.size)}
          </span>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            title={`Google Drive (${file.accountEmail || ''})`}
          >
            <CloudProviderIcon provider="google_drive" size={13} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
