import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Menu, Search, LayoutGrid, List, WifiOff, Upload, Settings, LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Box, AppBar, Toolbar, IconButton, InputBase, Button, Avatar, Menu as MuiMenu, MenuItem, Typography, useTheme, Paper } from '@mui/material';
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
  const theme = useTheme();
  const { sidebarOpen, connectModalOpen, offlineBanner } = useSelector(s => s.ui);
  const { viewMode, searchQuery } = useSelector(s => s.drive);
  const { user, signOut } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const userMenuOpen = Boolean(anchorEl);
  
  const { connectedAccounts } = useSelector(s => s.drive);
  const { uploadFiles } = useUpload();

  useOnlineStatus();

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
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.onchange = (ev) => {
            if (ev.target.files?.length) {
              uploadFiles(Array.from(ev.target.files), connectedAccounts[0].email);
            }
          };
          input.click();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [connectedAccounts, uploadFiles]);

  const handleSignOut = async () => {
    setAnchorEl(null);
    await signOut();
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', flexShrink: 0, borderRight: `1px solid ${theme.palette.divider}` }}
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {/* Offline banner */}
        <AnimatePresence>
          {offlineBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <Box sx={{ bgcolor: 'warning.light', color: 'warning.contrastText', py: 1, px: 2, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                <WifiOff size={16} />
                <Typography variant="caption">You are offline — changes will sync when reconnected</Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Toolbar sx={{ minHeight: '64px', gap: 2 }}>
            <IconButton onClick={() => dispatch(setSidebarOpen(!sidebarOpen))} edge="start">
              <Menu size={20} />
            </IconButton>

            {/* Search */}
            <Paper elevation={0} sx={{ flex: 1, maxWidth: 600, display: 'flex', alignItems: 'center', px: 2, py: 0.5, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Search size={18} style={{ color: theme.palette.text.secondary, marginRight: 8 }} />
              <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder="Search files, accounts…"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              />
            </Paper>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
              <Button
                variant="contained"
                startIcon={<Upload size={16} />}
                onClick={() => {
                  if (connectedAccounts.length > 0) {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e) => {
                      if (e.target.files?.length) {
                        uploadFiles(Array.from(e.target.files), connectedAccounts[0].email);
                      }
                    };
                    input.click();
                  } else {
                    dispatch(setConnectModalOpen(true));
                  }
                }}
                sx={{ borderRadius: 2, textTransform: 'none', display: { xs: 'none', sm: 'flex' } }}
              >
                Upload
              </Button>

              <Paper elevation={0} sx={{ display: 'flex', bgcolor: 'action.hover', borderRadius: 2, p: 0.5 }}>
                <IconButton 
                  size="small" 
                  onClick={() => dispatch(setViewMode(VIEW_MODES.GRID))}
                  sx={{ bgcolor: viewMode === VIEW_MODES.GRID ? 'background.paper' : 'transparent', borderRadius: 1 }}
                >
                  <LayoutGrid size={16} />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => dispatch(setViewMode(VIEW_MODES.LIST))}
                  sx={{ bgcolor: viewMode === VIEW_MODES.LIST ? 'background.paper' : 'transparent', borderRadius: 1 }}
                >
                  <List size={16} />
                </IconButton>
              </Paper>

              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar src={user?.photoURL} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                   {user?.displayName?.[0] || user?.email?.[0] || '?'}
                </Avatar>
              </IconButton>
              <MuiMenu
                anchorEl={anchorEl}
                open={userMenuOpen}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  elevation: 3,
                  sx: { mt: 1.5, minWidth: 200, borderRadius: 2 }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle2" noWrap>{user?.displayName || 'User'}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
                </Box>
                <MenuItem component={Link} to="/settings" onClick={() => setAnchorEl(null)} sx={{ mt: 1 }}>
                  <Settings size={16} style={{ marginRight: 12 }} /> Settings
                </MenuItem>
                <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
                  <LogOut size={16} style={{ marginRight: 12 }} /> Sign out
                </MenuItem>
              </MuiMenu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        </Box>
      </Box>

      <UploadQueue />
      <ConnectDriveModal open={connectModalOpen} onOpenChange={(o) => dispatch(setConnectModalOpen(o))} />
    </Box>
  );
};
