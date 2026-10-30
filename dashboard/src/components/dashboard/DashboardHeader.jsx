import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, FolderUp, FileUp, FolderPlus, RefreshCw, ChevronDown, Menu, Plus, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { setSidebarOpen } from '../../store/slices/uiSlice';

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  height: 36,
  padding: '0 10px',
  borderRadius: 7,
  border: 'none',
  cursor: 'pointer',
  color: 'var(--color-text-primary)',
  fontSize: '0.8125rem',
  textAlign: 'left',
};

export const DashboardHeader = ({
  loading,
  onRefresh,
  onUploadFiles,
  onUploadFolder,
  onCreateFolder,
  onTransferFiles,
  onOpenCommandPalette,
}) => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((s) => s.ui);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target)) setNewMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runMenuAction = (action) => {
    setNewMenuOpen(false);
    action?.();
  };

  return (
    <header
      style={{
        padding: '12px 32px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-base)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}
      className="du-topbar"
    >
      <button
        onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}
        aria-label="Toggle navigation menu"
        className="du-icon-btn du-icon-btn-outline lg:hidden"
        style={{ width: 40, height: 40, borderRadius: 10 }}
      >
        <Menu size={17} />
      </button>

      <button
        onClick={onOpenCommandPalette}
        title="Search files across all drives"
        style={{
          flex: '1 1 0',
          minWidth: 0,
          maxWidth: 560,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 12px',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '0.875rem',
        }}
      >
        <Search size={16} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Search files across all drives
        </span>
        <kbd
          className="hidden sm:inline"
          style={{
            padding: '2px 6px',
            borderRadius: 5,
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            fontSize: '0.6875rem',
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
        >
          ⌘K
        </kbd>
      </button>

      <div style={{ flex: '1 0 0', minWidth: 0 }} className="hidden md:block" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Sync all drives"
          title="Sync all drives"
          className="du-icon-btn du-icon-btn-outline"
          style={{ width: 40, height: 40, borderRadius: 10 }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>

        {onTransferFiles && (
          <button onClick={onTransferFiles} className="du-btn du-btn-lg hidden sm:inline-flex">
            <ArrowLeftRight size={16} />
            Transfer
          </button>
        )}

        <div style={{ position: 'relative' }} ref={newMenuRef}>
          <button
            onClick={() => setNewMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={newMenuOpen}
            className="du-btn du-btn-primary du-btn-lg"
          >
            <Plus size={16} />
            New
            <ChevronDown size={14} />
          </button>

          <AnimatePresence>
            {newMenuOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  width: 190,
                  borderRadius: 12,
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-popup)',
                  padding: 4,
                  zIndex: 60,
                  transformOrigin: 'top right',
                }}
              >
                <button role="menuitem" style={menuItemStyle} className="hover:bg-[var(--color-bg-overlay)]" onClick={() => runMenuAction(onUploadFiles)}>
                  <FileUp size={15} style={{ color: 'var(--color-text-secondary)' }} />
                  Upload files
                </button>
                <button role="menuitem" style={menuItemStyle} className="hover:bg-[var(--color-bg-overlay)]" onClick={() => runMenuAction(onUploadFolder)}>
                  <FolderUp size={15} style={{ color: 'var(--color-text-secondary)' }} />
                  Upload folder
                </button>
                {onCreateFolder && (
                  <>
                    <div style={{ height: 1, margin: '4px 6px', background: 'var(--color-border)' }} />
                    <button role="menuitem" style={menuItemStyle} className="hover:bg-[var(--color-bg-overlay)]" onClick={() => runMenuAction(onCreateFolder)}>
                      <FolderPlus size={15} style={{ color: 'var(--color-text-secondary)' }} />
                      New folder
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
