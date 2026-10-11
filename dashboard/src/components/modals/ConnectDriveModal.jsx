import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Check, X, Loader2, Plus, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Box, Typography, Avatar, Alert, ButtonBase } from '@mui/material';
import { useDrive } from '../../hooks/useDrive';
import { getAccountColor } from '../../config/constants';
import { getInitials } from '../../utils/formatters';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
);

export const ConnectDriveModal = ({ open, onOpenChange }) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const { connectedAccounts } = useSelector((s) => s.drive);
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
      description="Link multiple Google Drive accounts to manage, browse, and transfer files across all of them in one place."
      size="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Connect Action Button */}
        <ButtonBase
          onClick={handleConnect}
          disabled={connecting}
          sx={{
            py: 1.75,
            px: 2.5,
            borderRadius: 2.5,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'action.hover',
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            fontWeight: 600,
            fontSize: '0.9rem',
            width: '100%',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px -2px rgba(0,0,0,0.1)',
            '&:hover': {
              bgcolor: 'action.selected',
              borderColor: 'primary.main',
            },
            '&:disabled': {
              opacity: 0.6,
              cursor: 'not-allowed',
            },
          }}
        >
          {connecting ? (
            <>
              <Loader2 size={20} className="animate-spin text-blue-500" />
              <span>Connecting via Google OAuth…</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Connect with Google</span>
            </>
          )}
        </ButtonBase>

        {error && (
          <Alert severity="error" icon={<X size={18} />} sx={{ borderRadius: 2 }}>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ lineHeight: 1.45 }}>
            DriveUnify connects securely via official Google Drive APIs. Your credentials and file data are never stored on any intermediary servers.
          </Typography>
        </Box>

        {connectedAccounts.length > 0 && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1.25 }}
            >
              Connected Accounts ({connectedAccounts.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {connectedAccounts.map((account) => (
                <Box
                  key={account.email}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Avatar
                    src={account.picture}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: getAccountColor(account.email),
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    {!account.picture && getInitials(account.email)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8125rem' }}>
                      {account.name || account.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.72rem' }}>
                      {account.email}
                    </Typography>
                  </Box>
                  <Box sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.5, pr: 0.5 }}>
                    <Check size={16} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

