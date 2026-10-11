import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, File, Folder, Cloud, Upload, FolderPlus,
  ArrowRight, HardDrive, List, LayoutGrid, X
} from 'lucide-react';
import { FileIcon } from '../explorer/FileIcon';
import { ProviderBadge } from '../common/ProviderBadge';
import { isFolder } from '../../utils/helpers';
import { formatFileSize } from '../../utils/formatters';

export const CommandPalette = ({
  open,
  onClose,
  files = [],
  connectedAccounts = [],
  onSelectFile,
  onUploadFiles,
  onCreateFolder,
  onConnectDrive,
  onSetViewMode,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build items based on query
  const q = query.toLowerCase().trim();

  // 1. Files & Folders match
  const matchedFiles = files
    .filter(f =>
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.accountEmail?.toLowerCase().includes(q) ||
      f.category?.toLowerCase().includes(q)
    )
    .slice(0, 8);

  // 2. Quick Actions
  const staticActions = [
    {
      id: 'act-upload',
      type: 'action',
      label: 'Upload files',
      category: 'Actions',
      icon: Upload,
      action: onUploadFiles,
    },
    {
      id: 'act-folder',
      type: 'action',
      label: 'Create new folder',
      category: 'Actions',
      icon: FolderPlus,
      action: onCreateFolder,
    },
    {
      id: 'act-connect',
      type: 'action',
      label: 'Connect another cloud drive',
      category: 'Actions',
      icon: Cloud,
      action: onConnectDrive,
    },
    {
      id: 'act-list',
      type: 'action',
      label: 'Switch to list view',
      category: 'Actions',
      icon: List,
      action: () => onSetViewMode?.('list'),
    },
    {
      id: 'act-grid',
      type: 'action',
      label: 'Switch to grid view',
      category: 'Actions',
      icon: LayoutGrid,
      action: () => onSetViewMode?.('grid'),
    },
  ];

  const matchedActions = staticActions.filter(a =>
    !q || a.label.toLowerCase().includes(q)
  );

  // Combine flat list for keyboard navigation
  const flatItems = [
    ...matchedFiles.map(f => ({ type: 'file', data: f, id: f.id + f.accountEmail })),
    ...matchedActions.map(a => ({ type: 'action', data: a, id: a.id })),
  ];

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (flatItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (flatItems.length || 1)) % (flatItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flatItems[selectedIndex];
        if (selected) {
          executeItem(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, flatItems, onClose]);

  const executeItem = (item) => {
    if (item.type === 'file') {
      onSelectFile?.(item.data);
    } else if (item.type === 'action') {
      item.data.action?.();
    }
    onClose?.();
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '12vh',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 600,
            borderRadius: 12,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-strong)',
            boxShadow: 'var(--shadow-popup)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10000,
          }}
        >
          {/* Search Input Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-border)',
              gap: 10,
            }}
          >
            <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search files, folders, drives, or actions…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.9rem',
                color: 'var(--color-text-primary)',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
            <kbd
              style={{
                fontSize: '0.675rem',
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div
            style={{
              maxHeight: 380,
              overflowY: 'auto',
              padding: '6px 8px',
            }}
            className="scrollbar-thin"
          >
            {flatItems.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No results found for "{query}"
              </div>
            ) : (
              <>
                {/* Files Section */}
                {matchedFiles.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        padding: '6px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Files & Folders
                    </div>
                    {matchedFiles.map((file, i) => {
                      const isSelected = selectedIndex === i;
                      const isDir = isFolder(file);

                      return (
                        <div
                          key={file.id + file.accountEmail}
                          onClick={() => executeItem({ type: 'file', data: file })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 7,
                            background: isSelected ? 'var(--color-bg-overlay)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background var(--transition-fast)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <FileIcon category={file.category} size={16} />
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.8125rem',
                                  fontWeight: 500,
                                  color: 'var(--color-text-primary)',
                                  truncate: true,
                                }}
                              >
                                {file.name}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--color-text-muted)',
                                  display: 'flex',
                                  gap: 6,
                                }}
                              >
                                <span>{isDir ? 'Folder' : formatFileSize(file.size)}</span>
                                <span>·</span>
                                <span>{file.parents?.[0] ? 'Subfolder' : 'My Drive'}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <ProviderBadge
                              provider="google_drive"
                              accountEmail={file.accountEmail}
                              compact
                            />
                            {isSelected && (
                              <ArrowRight size={13} style={{ color: 'var(--color-text-secondary)' }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions Section */}
                {matchedActions.length > 0 && (
                  <div>
                    <div
                      style={{
                        padding: '6px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Quick Actions
                    </div>
                    {matchedActions.map((action, i) => {
                      const itemIndex = matchedFiles.length + i;
                      const isSelected = selectedIndex === itemIndex;
                      const Icon = action.icon;

                      return (
                        <div
                          key={action.id}
                          onClick={() => executeItem({ type: 'action', data: action })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 7,
                            background: isSelected ? 'var(--color-bg-overlay)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background var(--transition-fast)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon size={15} style={{ color: 'var(--color-text-secondary)' }} />
                            <span
                              style={{
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                color: 'var(--color-text-primary)',
                              }}
                            >
                              {action.label}
                            </span>
                          </div>

                          {isSelected && (
                            <ArrowRight size={13} style={{ color: 'var(--color-text-secondary)' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer instructions */}
          <div
            style={{
              padding: '8px 14px',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              <span><kbd>↑↓</kbd> to navigate</span>
              <span><kbd>↵</kbd> to select</span>
              <span><kbd>esc</kbd> to dismiss</span>
            </div>
            <span>DriveUnify Search</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
