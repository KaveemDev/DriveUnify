import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  User, HardDrive, Settings as SettingsIcon, AlertTriangle,
  RefreshCw, Plus, LogOut, Shield,
} from 'lucide-react';
import { Box, Typography, Avatar, Button, Select, MenuItem, Paper, Chip } from '@mui/material';
import { useDrive } from '../../hooks/useDrive';
import { useAuth } from '../../hooks/useAuth';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatFileSize } from '../../utils/formatters';
import { setConnectModalOpen } from '../../store/slices/uiSlice';
import { setViewMode, setSortBy } from '../../store/slices/driveSlice';
import { VIEW_MODES, SORT_OPTIONS } from '../../config/constants';
import { getAccountColor } from '../../config/constants';

const Section = ({ title, icon: Icon, children }) => (
  <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
      <Icon size={18} color="text.secondary" />
      <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
    </Box>
    <Box sx={{ p: 3 }}>{children}</Box>
  </Paper>
);

const Settings = () => {
  const dispatch = useDispatch();
  const { user, signOut } = useAuth();
  const { connectedAccounts, viewMode, sortBy } = useSelector(s => s.drive);
  const { disconnectAccount, refreshAccount } = useDrive();
  const [signOutConfirm, setSignOutConfirm] = useState(false);

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 600, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="h5" fontWeight="bold" mb={2}>Settings</Typography>

        <Section title="Profile" icon={User}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar src={user?.photoURL} sx={{ width: 64, height: 64, fontSize: 24, bgcolor: 'primary.main' }}>
              {user?.displayName?.[0] || '?'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">{user?.displayName || 'User'}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Signed in via Google</Typography>
            </Box>
          </Box>
        </Section>

        <Section title="Connected Drives" icon={HardDrive}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {connectedAccounts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" py={2}>
                No Google Drive accounts connected yet.
              </Typography>
            ) : (
              connectedAccounts.map(account => (
                <Box key={account.email} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: getAccountColor(account.email), flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight="medium" noWrap>{account.email}</Typography>
                    {account.storage && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatFileSize(account.storage.used)} / {formatFileSize(account.storage.limit)} used
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<RefreshCw size={14} />} onClick={() => refreshAccount(account.email)}>Refresh</Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => disconnectAccount(account.email)}>Disconnect</Button>
                  </Box>
                </Box>
              ))
            )}
            <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => dispatch(setConnectModalOpen(true))} sx={{ mt: 1 }} disableElevation>
              Add Another Drive
            </Button>
          </Box>
        </Section>

        <Section title="Preferences" icon={SettingsIcon}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" fontWeight="medium">Default view</Typography>
                <Typography variant="caption" color="text.secondary">How files are displayed by default</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="Grid" variant={viewMode === VIEW_MODES.GRID ? 'filled' : 'outlined'} color={viewMode === VIEW_MODES.GRID ? 'primary' : 'default'} onClick={() => dispatch(setViewMode(VIEW_MODES.GRID))} />
                <Chip label="List" variant={viewMode === VIEW_MODES.LIST ? 'filled' : 'outlined'} color={viewMode === VIEW_MODES.LIST ? 'primary' : 'default'} onClick={() => dispatch(setViewMode(VIEW_MODES.LIST))} />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" fontWeight="medium">Default sort</Typography>
                <Typography variant="caption" color="text.secondary">How files are sorted by default</Typography>
              </Box>
              <Select size="small" value={sortBy} onChange={(e) => dispatch(setSortBy(e.target.value))} sx={{ minWidth: 160 }}>
                {SORT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
        </Section>

        <Section title="Danger Zone" icon={AlertTriangle}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderRadius: 2, bgcolor: 'error.main', color: 'error.contrastText', opacity: 0.9 }}>
            <Box>
              <Typography variant="body2" fontWeight="bold">Sign out</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>Sign out of your DriveUnify account</Typography>
            </Box>
            <Button variant="contained" color="inherit" sx={{ color: 'error.main' }} startIcon={<LogOut size={16} />} onClick={() => setSignOutConfirm(true)}>
              Sign Out
            </Button>
          </Box>
        </Section>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 2, opacity: 0.5 }}>
          <Shield size={14} />
          <Typography variant="caption">DriveUnify v2.0 · Files are never stored on our servers</Typography>
        </Box>
      </Box>

      <ConfirmDialog
        open={signOutConfirm}
        onOpenChange={setSignOutConfirm}
        title="Sign out?"
        description="You will be redirected to the login page."
        confirmLabel="Sign Out"
        confirmVariant="danger"
        onConfirm={signOut}
      />
    </Box>
  );
};

export default Settings;
