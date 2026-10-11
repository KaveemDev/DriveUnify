import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Menu, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ConnectDriveModal } from '../components/modals/ConnectDriveModal';
import { UploadQueue } from '../components/upload/UploadQueue';
import { setSidebarOpen, setConnectModalOpen } from '../store/slices/uiSlice';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const DashboardLayout = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarOpen, connectModalOpen, offlineBanner } = useSelector((s) => s.ui);

  useOnlineStatus();

  // Responsive sidebar: open on desktop (>= 1024px), closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        dispatch(setSidebarOpen(false));
      } else {
        dispatch(setSidebarOpen(true));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  const isDashboard = location.pathname === '/dashboard';

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--color-bg-base)',
        color: 'var(--color-text-primary)',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(setSidebarOpen(false))}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(2px)',
            }}
            className="lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar — Desktop: static, Mobile/Tablet: drawer overlay ── */}
      {/* Desktop Persistent Sidebar */}
      {sidebarOpen && (
        <div className="hidden lg:flex flex-shrink-0" style={{ zIndex: 30 }}>
          <Sidebar />
        </div>
      )}

      {/* Mobile Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sidebar-mobile"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: '0 auto 0 0',
              zIndex: 50,
              width: 'var(--sidebar-width)',
              height: '100%',
            }}
            className="lg:hidden"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Area ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── Offline Banner ── */}
        <AnimatePresence>
          {offlineBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: 'rgba(249, 115, 22, 0.08)',
                borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
                color: '#f97316',
                padding: '6px 16px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: '0.78rem',
                fontWeight: 500,
              }}
            >
              <WifiOff size={13} />
              You are offline — changes will sync when reconnected
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content View ── */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </main>
      </div>

      <UploadQueue />
      <ConnectDriveModal
        open={connectModalOpen}
        onOpenChange={(o) => dispatch(setConnectModalOpen(o))}
      />
    </div>
  );
};
