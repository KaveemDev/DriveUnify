import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, WifiOff, Upload, Bell, MoreHorizontal, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ConnectDriveModal } from '../components/modals/ConnectDriveModal';
import { UploadQueue } from '../components/upload/UploadQueue';
import { setSidebarOpen, setConnectModalOpen } from '../store/slices/uiSlice';
import { setSearchQuery } from '../store/slices/driveSlice';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useUpload } from '../hooks/useUpload';

export const DashboardLayout = ({ children }) => {
  const dispatch = useDispatch();
  const { sidebarOpen, connectModalOpen, offlineBanner } = useSelector(s => s.ui);
  const { connectedAccounts, searchQuery } = useSelector(s => s.drive);

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { uploadFiles } = useUpload();

  useOnlineStatus();

  // Default: open on desktop, closed on mobile
  useEffect(() => {
    const handleResize = () => {
      dispatch(setSidebarOpen(window.innerWidth >= 768));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  // Keyboard shortcut: 'U' to upload
  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === 'u' && !e.ctrlKey && !e.metaKey &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        if (connectedAccounts.length > 0) triggerFileUpload();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [connectedAccounts]);

  const triggerFileUpload = () => {
    if (connectedAccounts.length > 0) {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.onchange = (ev) => {
        if (ev.target.files?.length)
          uploadFiles(Array.from(ev.target.files), connectedAccounts[0].email);
      };
      input.click();
    } else {
      dispatch(setConnectModalOpen(true));
    }
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'var(--color-bg-base)',
      color: 'var(--color-text-primary)',
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => dispatch(setSidebarOpen(false))}
            style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.4)' }}
            className="md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar — desktop: static, mobile: overlay ── */}
      {/* Desktop */}
      {sidebarOpen && (
        <div className="hidden md:flex flex-shrink-0" style={{ zIndex: 'auto' }}>
          <Sidebar />
        </div>
      )}
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sidebar-mobile"
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ position: 'fixed', inset: '0 auto 0 0', zIndex: 40 }}
            className="md:hidden"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* ── Offline Banner ── */}
        <AnimatePresence>
          {offlineBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{
                background: 'rgba(249,115,22,0.08)', borderBottom: '1px solid rgba(249,115,22,0.2)',
                color: '#f97316', padding: '7px 16px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: '0.8rem', fontWeight: 500,
              }}
            >
              <WifiOff size={14} />
              You are offline — changes will sync when reconnected
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Header ── */}
        <header style={{
          flexShrink: 0,
          height: 'var(--header-height)',
          padding: '0 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
          zIndex: 20,
        }}>
          {/* Hamburger */}
          <button
            onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}
            title="Toggle sidebar"
            style={{
              width: 30, height: 30, borderRadius: 6,
              border: '1px solid var(--color-border)', background: 'transparent',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 130ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Menu size={15} />
          </button>

          {/* Mobile search overlay */}
          {mobileSearchOpen && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 50, display: 'flex',
              alignItems: 'center', padding: '0 16px', gap: 10,
              background: 'var(--color-bg-surface)',
            }}>
              <button onClick={() => setMobileSearchOpen(false)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)',
              }}>
                <X size={18} />
              </button>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)', pointerEvents: 'none',
                }} />
                <input
                  autoFocus type="text" placeholder="Search files…"
                  value={searchQuery}
                  onChange={e => dispatch(setSearchQuery(e.target.value))}
                  style={{
                    width: '100%', padding: '7px 10px 7px 32px',
                    borderRadius: 7, border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-primary)', fontSize: '0.85rem', outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Mobile search icon */}
            <button
              className="md:hidden"
              onClick={() => setMobileSearchOpen(true)}
              style={{
                width: 30, height: 30, borderRadius: 6,
                border: '1px solid var(--color-border)', background: 'transparent',
                cursor: 'pointer', color: 'var(--color-text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Search size={15} />
            </button>

            {/* Upload */}
            <button
              onClick={triggerFileUpload}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 7,
                background: 'var(--color-accent)', color: 'var(--color-accent-fg)',
                border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                transition: 'opacity 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Upload size={13} />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* Bell */}
            <button style={{
              width: 30, height: 30, borderRadius: 6,
              border: '1px solid var(--color-border)', background: 'transparent',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 130ms',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Bell size={15} />
            </button>

            {/* More */}
            <button style={{
              width: 30, height: 30, borderRadius: 6,
              border: '1px solid var(--color-border)', background: 'transparent',
              cursor: 'pointer', color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 130ms',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="scrollbar-thin">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{ height: '100%' }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <UploadQueue />
      <ConnectDriveModal open={connectModalOpen} onOpenChange={(o) => dispatch(setConnectModalOpen(o))} />
    </div>
  );
};
