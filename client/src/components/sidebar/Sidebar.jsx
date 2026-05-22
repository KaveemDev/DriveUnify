import { useDispatch, useSelector } from 'react-redux';
import { CloudCog, Files, Plus, Settings, ChevronLeft, Cloud, Sun, Moon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Typography, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Divider, Button as MuiButton } from '@mui/material';
import { AccountItem } from './AccountItem';
import { StorageBar } from './StorageBar';
import { setSidebarOpen, setConnectModalOpen } from '../../store/slices/uiSlice';
import { setSelectedAccount } from '../../store/slices/driveSlice';
import { useDrive } from '../../hooks/useDrive';
import { useColorMode } from '../../theme';

export const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { connectedAccounts, files, selectedAccount } = useSelector(s => s.drive);
  const { disconnectAccount, refreshAccount, reconnectAccount } = useDrive();
  const { mode, toggleColorMode } = useColorMode();

  const totalFiles = files.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 260, bgcolor: 'background.paper' }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.contrastText', boxShadow: 2 }}>
            <Cloud size={18} />
          </Box>
          <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
            DriveUnify
          </Typography>
        </Box>
        <Box>
          <IconButton size="small" onClick={toggleColorMode} sx={{ mr: 1 }}>
            {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>
          <IconButton size="small" onClick={() => dispatch(setSidebarOpen(false))} sx={{ display: { sm: 'none' } }}>
            <ChevronLeft size={16} />
          </IconButton>
        </Box>
      </Box>

      {/* Nav */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItemButton
          component={Link}
          to="/dashboard"
          selected={location.pathname === '/dashboard' && !selectedAccount}
          onClick={() => dispatch(setSelectedAccount(null))}
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}><Files size={18} /></ListItemIcon>
          <ListItemText primary="All Files" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
          <Typography variant="caption" color="text.secondary">{totalFiles}</Typography>
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/settings"
          selected={location.pathname === '/settings'}
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}><Settings size={18} /></ListItemIcon>
          <ListItemText primary="Settings" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
        </ListItemButton>
      </List>

      <Divider />

      {/* Connected Accounts */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, px: 1 }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Connected Drives
          </Typography>
          <Typography variant="caption" color="text.secondary">{connectedAccounts.length}</Typography>
        </Box>

        {connectedAccounts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <CloudCog size={32} style={{ margin: '0 auto', marginBottom: 8, opacity: 0.5 }} />
            <Typography variant="caption" color="text.secondary">No drives connected yet</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {connectedAccounts.map(account => (
              <AccountItem
                key={account.email}
                account={account}
                onDisconnect={disconnectAccount}
                onRefresh={refreshAccount}
                onReconnect={reconnectAccount}
              />
            ))}
          </List>
        )}
      </Box>

      {/* Connect Button */}
      <Box sx={{ px: 2, pb: 2 }}>
        <MuiButton
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<Plus size={18} />}
          onClick={() => dispatch(setConnectModalOpen(true))}
          sx={{ borderRadius: 2 }}
        >
          Connect Drive
        </MuiButton>
      </Box>

      {/* Storage Bar */}
      <StorageBar />
    </Box>
  );
};
