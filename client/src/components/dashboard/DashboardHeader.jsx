import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Upload, FolderUp, FileUp, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardHeader = ({
  user,
  loading,
  onRefresh,
  onUploadFiles,
  onUploadFolder,
  onOpenCommandPalette,
  unreadCount = 0,
  title = null,
  subtitle = null,
}) => {
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const uploadMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Contextual greeting based on hour of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.displayName
    ? user.displayName.split(' ')[0]
    : user?.email ? user.email.split('@')[0] : 'there';

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target)) {
        setUploadMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      {/* ── Left: Contextual Greeting ── */}
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: '1.35rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
            lineHeight: 1.25,
          }}
        >
          {title || `${getGreeting()}, ${displayName}`}
        </h1>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            fontWeight: 400,
          }}
        >
          {subtitle || "Here's what's happening across your connected drives."}
        </p>
      </div>

      {/* ── Right: Global Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="group"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 12px',
            borderRadius: 7,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            transition: 'border-color var(--transition-fast), background var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-strong)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
          title="Search files, folders, and actions (⌘K)"
        >
          <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Search files across drives…
          </span>
          <kbd
            style={{
              padding: '1px 5px',
              borderRadius: 4,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-muted)',
              fontSize: '0.675rem',
              fontWeight: 500,
              fontFamily: 'inherit',
              marginLeft: 4,
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Refresh Files Button */}
        <button
          onClick={onRefresh}
          title="Sync drives"
          disabled={loading}
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            cursor: loading ? 'not-allowed' : 'pointer',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = 'var(--color-bg-overlay)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifMenuRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Notifications"
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#3b82f6',
                }}
              />
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  width: 280,
                  borderRadius: 10,
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-popup)',
                  padding: 12,
                  zIndex: 60,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 8,
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <span>Notifications</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>All caught up</span>
                </div>
                <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                  <Check size={18} style={{ margin: '0 auto 6px', color: '#10b981' }} />
                  All drives connected and synced
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Primary Upload Action */}
        <div style={{ position: 'relative' }} ref={uploadMenuRef}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={onUploadFiles}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 14px',
                borderTopLeftRadius: 7,
                borderBottomLeftRadius: 7,
                background: 'var(--color-accent)',
                color: 'var(--color-accent-fg)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                transition: 'opacity var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Upload size={14} />
              <span>Upload</span>
            </button>
            <button
              onClick={() => setUploadMenuOpen(!uploadMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 8px',
                borderTopRightRadius: 7,
                borderBottomRightRadius: 7,
                background: 'var(--color-accent)',
                color: 'var(--color-accent-fg)',
                border: 'none',
                borderLeft: '1px solid rgba(0,0,0,0.15)',
                cursor: 'pointer',
                transition: 'opacity var(--transition-fast)',
              }}
              title="More upload options"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <ChevronDown size={13} />
            </button>
          </div>

          <AnimatePresence>
            {uploadMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  width: 170,
                  borderRadius: 9,
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-popup)',
                  padding: 4,
                  zIndex: 60,
                }}
              >
                <button
                  onClick={() => {
                    setUploadMenuOpen(false);
                    onUploadFiles();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <FileUp size={14} style={{ color: 'var(--color-text-secondary)' }} />
                  <span>Upload files</span>
                </button>
                <button
                  onClick={() => {
                    setUploadMenuOpen(false);
                    onUploadFolder();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <FolderUp size={14} style={{ color: 'var(--color-text-secondary)' }} />
                  <span>Upload folder</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
