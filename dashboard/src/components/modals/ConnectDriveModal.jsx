import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Check, X, Loader2, Sparkles, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Box, Typography, Avatar, Alert, ButtonBase, TextField } from '@mui/material';
import { useDrive } from '../../hooks/useDrive';
import { getAccountColor } from '../../config/constants';
import { getInitials } from '../../utils/formatters';
import { DropboxIcon, CloudProviderIcon } from '../common/ProviderBadge';
import { getAccountId } from '../../utils/helpers';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
);

export const ConnectDriveModal = ({ open, onOpenChange }) => {
  const [connectingProvider, setConnectingProvider] = useState(null); // 'google' | 'dropbox' | null
  const [error, setError] = useState(null);
  const [customDbxKey, setCustomDbxKey] = useState('');
  const [showDbxKeyInput, setShowDbxKeyInput] = useState(false);
  const { connectedAccounts } = useSelector((s) => s.drive);
  const { connectNewAccount } = useDrive();

  const handleConnectGoogle = async () => {
    setError(null);
    setConnectingProvider('google');
    try {
      await connectNewAccount('google_drive');
      onOpenChange(false);
    } catch (err) {
      if (!err.message?.includes('closed')) {
        setError(err.message);
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleConnectDropbox = async () => {
    setError(null);
    setConnectingProvider('dropbox');
    try {
      const keyToUse = customDbxKey.trim() || import.meta.env.VITE_DROPBOX_CLIENT_ID;
      await connectNewAccount('dropbox', keyToUse);
      onOpenChange(false);
    } catch (err) {
      if (!err.message?.includes('closed')) {
        setError(err.message);
        if (err.message?.toLowerCase().includes('client') || err.message?.toLowerCase().includes('key') || !import.meta.env.VITE_DROPBOX_CLIENT_ID) {
          setShowDbxKeyInput(true);
        }
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Connect Cloud Storage"
      description="Link multiple Google Drive and Dropbox accounts to manage, browse, and transfer files across all of them in one place."
      size="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
        {/* Action 1: Connect Google Drive */}
        <ButtonBase
          onClick={handleConnectGoogle}
          disabled={connectingProvider !== null}
          sx={{
            py: 1.5,
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
            fontSize: '0.88rem',
            width: '100%',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px -2px rgba(0,0,0,0.08)',
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
          {connectingProvider === 'google' ? (
            <>
              <Loader2 size={18} className="animate-spin text-blue-500" />
              <span>Connecting Google Drive…</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Connect with Google Drive</span>
            </>
          )}
        </ButtonBase>

        {/* Action 2: Connect Dropbox */}
        <ButtonBase
          onClick={handleConnectDropbox}
          disabled={connectingProvider !== null}
          sx={{
            py: 1.5,
            px: 2.5,
            borderRadius: 2.5,
            border: 1,
            borderColor: '#0061FF',
            bgcolor: 'rgba(0, 97, 255, 0.08)',
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            fontWeight: 600,
            fontSize: '0.88rem',
            width: '100%',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px -2px rgba(0, 97, 255, 0.2)',
            '&:hover': {
              bgcolor: 'rgba(0, 97, 255, 0.16)',
              borderColor: '#0061FF',
            },
            '&:disabled': {
              opacity: 0.6,
              cursor: 'not-allowed',
            },
          }}
        >
          {connectingProvider === 'dropbox' ? (
            <>
              <Loader2 size={18} className="animate-spin text-blue-400" />
              <span>Connecting Dropbox…</span>
            </>
          ) : (
            <>
              <DropboxIcon size={19} />
              <span>Connect with Dropbox</span>
            </>
          )}
        </ButtonBase>

        {/* Custom Dropbox Key Toggle / Input */}
        <Box sx={{ mt: -0.5 }}>
          <Box
            onClick={() => setShowDbxKeyInput(!showDbxKeyInput)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              cursor: 'pointer',
              color: 'text.secondary',
              fontSize: '0.74rem',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <Key size={12} />
            <span>{showDbxKeyInput ? 'Hide Dropbox App Key' : 'Have a Dropbox App Key?'}</span>
            {showDbxKeyInput ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Box>

          {showDbxKeyInput && (
            <Box sx={{ mt: 1.25, p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.72rem' }}>
                Enter your Dropbox App Key (found in your Dropbox App Console):
              </Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="e.g. k7b... (Dropbox App Key)"
                value={customDbxKey}
                onChange={(e) => setCustomDbxKey(e.target.value)}
                sx={{
                  '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.75 },
                }}
              />
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" icon={<X size={18} />} sx={{ borderRadius: 2 }}>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ lineHeight: 1.45 }}>
            DriveUnify connects securely via official Google Drive and Dropbox APIs. Your file contents stream directly between verified servers and are never stored on intermediary servers.
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
                  key={getAccountId(account)}
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
                      bgcolor: getAccountColor(account),
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    {!account.picture && getInitials(account.email)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8125rem' }}>
                        {account.name || account.email}
                      </Typography>
                      <CloudProviderIcon provider={account.provider} size={13} />
                    </Box>
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
export default ConnectDriveModal;
