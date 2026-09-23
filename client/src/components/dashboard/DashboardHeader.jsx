import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Bell, Upload, FolderUp, FileUp, RefreshCw, ChevronDown, Check, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { setSidebarOpen } from '../../store/slices/uiSlice';

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
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((s) => s.ui);
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
      className="dashboard-header-container"
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* ── Top Bar: Hamburger, Title & Right Actions ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          width: '100%',
        }}
      >
        {/* Left: Hamburger trigger on mobile + Contextual Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <button
            onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}
            title="Toggle navigation menu"
            className="lg:hidden"
            style={{
              width: 34,
              height: 34,
              borderRadius: 7,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Menu size={17} />
          </button>

          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'var(--color-text-primary)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title || `${getGreeting()}, ${displayName}`}
            </h1>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '0.78rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {subtitle || "Here's what's happening across your connected drives."}
            </p>
          </div>
        </div>

        {/* Right Actions: Sync, Notifications, Upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Refresh Files Button */}
          <button
            onClick={onRefresh}
            title="Sync drives"
            disabled={loading}
            style={{
              width: 34,
              height: 34,
              borderRadius: 7,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notifMenuRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications"
              style={{
                width: 34,
                height: 34,
                borderRadius: 7,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 7,
                    right: 7,
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
                  gap: 6,
                  padding: '7px 12px',
                  borderTopLeftRadius: 7,
                  borderBottomLeftRadius: 7,
                  background: 'var(--color-accent)',
                  color: 'var(--color-accent-fg)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
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
                  padding: '7px 7px',
                  borderTopRightRadius: 7,
                  borderBottomRightRadius: 7,
                  background: 'var(--color-accent)',
                  color: 'var(--color-accent-fg)',
                  border: 'none',
                  borderLeft: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="More upload options"
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
                    }}
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
                    }}
                  >
                    <FolderUp size={14} style={{ color: 'var(--color-text-secondary)' }} />
                    <span>Upload folder</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Search Bar: Full width on mobile, prominent touch target ── */}
      <button
        onClick={onOpenCommandPalette}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'border-color var(--transition-fast)',
        }}
        title="Search files across all drives"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Search size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Search files across drives…
          </span>
        </div>
        <kbd
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-muted)',
            fontSize: '0.675rem',
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
        >
          ⌘K
        </kbd>
      </button>
    </header>
  );
};

