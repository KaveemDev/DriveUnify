import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Menu, Search, LayoutGrid, List, WifiOff, Upload, Settings, LogOut, Bell, Cloud, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ConnectDriveModal } from '../components/modals/ConnectDriveModal';
import { UploadQueue } from '../components/upload/UploadQueue';
import { setSidebarOpen, setConnectModalOpen } from '../store/slices/uiSlice';
import { setSearchQuery, setViewMode } from '../store/slices/driveSlice';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { VIEW_MODES } from '../config/constants';
import { useUpload } from '../hooks/useUpload';

export const DashboardLayout = ({ children }) => {
  const dispatch = useDispatch();
  const { sidebarOpen, connectModalOpen, offlineBanner } = useSelector(s => s.ui);
  const { viewMode, searchQuery, connectedAccounts } = useSelector(s => s.drive);
  const { user, signOut } = useAuth();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { uploadFiles } = useUpload();

  useOnlineStatus();

  // On mobile, close sidebar by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        dispatch(setSidebarOpen(false));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  // Keyboard shortcut: 'U' to upload
  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === 'u' &&
        !e.ctrlKey && !e.metaKey &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        if (connectedAccounts.length > 0) {
          triggerFileUpload();
        }
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
        if (ev.target.files?.length) {
          uploadFiles(Array.from(ev.target.files), connectedAccounts[0].email);
        }
      };
      input.click();
    } else {
      dispatch(setConnectModalOpen(true));
    }
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans">
      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop — mobile only */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setSidebarOpen(false))}
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
            />
            {/* Sidebar */}
            <motion.div
              key="sidebar"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              className="fixed md:relative inset-y-0 left-0 z-40 md:z-auto w-[260px] flex-shrink-0 border-r border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/90 backdrop-blur-xl"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Offline banner */}
        <AnimatePresence>
          {offlineBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-orange-50 dark:bg-orange-500/10 border-b border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 py-2 px-4 flex items-center justify-center gap-2 flex-shrink-0"
            >
              <WifiOff size={16} />
              <span className="text-sm font-medium">You are offline — changes will sync when reconnected</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Navigation */}
        <header className="flex-shrink-0 h-14 px-3 md:px-5 flex items-center gap-2 md:gap-3 border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20">
          {/* Hamburger */}
          <button
            onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}
            className="flex-shrink-0 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Logo — shown when sidebar is closed on desktop */}
          {!sidebarOpen && (
            <Link to="/dashboard" className="hidden md:flex items-center gap-2 flex-shrink-0 mr-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <Cloud size={16} />
              </div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">DriveUnify</span>
            </Link>
          )}

          {/* Search — desktop: full bar, mobile: hidden unless toggled */}
          <div className={`${mobileSearchOpen ? 'flex absolute inset-x-0 top-0 h-14 bg-white dark:bg-slate-900 px-4 z-50 items-center' : 'hidden md:flex'} flex-1`}>
            {mobileSearchOpen && (
              <button onClick={() => setMobileSearchOpen(false)} className="mr-3 text-slate-500">
                <X size={20} />
              </button>
            )}
            <div className="relative flex-1 max-w-xl">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search files and folders…"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                autoFocus={mobileSearchOpen}
                className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Spacer when search is inline on desktop */}
          <div className="flex-1 md:hidden" />

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* View mode toggle — hidden on xs */}
            <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 items-center gap-0.5">
              <button
                onClick={() => dispatch(setViewMode(VIEW_MODES.GRID))}
                className={`p-1.5 rounded-md transition-colors ${viewMode === VIEW_MODES.GRID ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                aria-label="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => dispatch(setViewMode(VIEW_MODES.LIST))}
                className={`p-1.5 rounded-md transition-colors ${viewMode === VIEW_MODES.LIST ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>

            {/* Upload button */}
            <button
              onClick={triggerFileUpload}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              aria-label="Upload files"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* User avatar */}
            <div className="relative ml-1">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors flex-shrink-0"
                aria-label="User menu"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.displayName?.[0] || user?.email?.[0] || '?'}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{user?.displayName || 'User'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                      </div>
                      <div className="p-1.5">
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Settings size={15} /> Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-0.5"
                        >
                          <LogOut size={15} /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="h-full"
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
