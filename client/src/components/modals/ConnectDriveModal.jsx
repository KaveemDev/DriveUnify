import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Check, X, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button, Box, Typography, Avatar, Alert } from '@mui/material';
import { useDrive } from '../../hooks/useDrive';
import { getAccountColor } from '../../config/constants';
import { getInitials } from '../../utils/formatters';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
);

export const ConnectDriveModal = ({ open, onOpenChange }) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const { connectedAccounts } = useSelector(s => s.drive);
  const { connectNewAccount } = useDrive();

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      await connectNewAccount();
    } catch (err) {
      if (!err.message?.includes('closed')) {
        setError(err.message);
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Connect Google Drive"
      description="Add a Google Drive account to manage all your files in one place."
      size="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Button
          variant="outlined"
          onClick={handleConnect}
          disabled={connecting}
          startIcon={connecting ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
          sx={{ py: 1.5, color: 'text.primary', borderColor: 'divider', bgcolor: 'background.paper', textTransform: 'none', fontWeight: 500 }}
          fullWidth
        >
          {connecting ? 'Opening Google OAuth…' : 'Connect with Google'}
        </Button>

        {error && (
          <Alert severity="error" icon={<X size={16} />}>
            {error}
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" align="center" display="block">
          We request Drive access to read and manage your files. No data is stored on our servers.
        </Typography>

        {connectedAccounts.length > 0 && (
          <Box>
            <Typography variant="overline" color="text.secondary" display="block" mb={1}>
              Connected accounts
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {connectedAccounts.map(account => (
                <Box key={account.email} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 2, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
                  <Avatar src={account.picture} sx={{ width: 32, height: 32, bgcolor: getAccountColor(account.email), fontSize: 12 }}>
                    {!account.picture && getInitials(account.email)}
                  </Avatar>
                  <Typography variant="body2" sx={{ flex: 1 }} noWrap>{account.email}</Typography>
                  <Check size={16} color="#10b981" />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};
