import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, RefreshCw, PlugZap } from 'lucide-react';
import { Box, Typography, IconButton, Avatar, ListItemButton, Chip, LinearProgress } from '@mui/material';
import { setSelectedAccount } from '../../store/slices/driveSlice';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatFileSize } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';
import { getInitials } from '../../utils/formatters';

export const AccountItem = ({ account, onDisconnect, onRefresh, onReconnect }) => {
  const dispatch = useDispatch();
  const { selectedAccount } = useSelector(s => s.drive);
  const [showConfirm, setShowConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const isExpired = account.needsReconnect || account.expired;
  const isSelected = selectedAccount === account.email;
  const color = getAccountColor(account.email);
  const storage = account.storage;

  const handleSelect = () => {
    dispatch(setSelectedAccount(isSelected ? null : account.email));
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await onDisconnect(account.email);
    } finally {
      setDisconnecting(false);
      setShowConfirm(false);
    }
  };

  const handleReconnect = async (e) => {
    e.stopPropagation();
    setReconnecting(true);
    try {
      await onReconnect?.(account.email);
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={handleSelect}
        sx={{
          borderRadius: 2,
          mb: 0.5,
          p: 1,
          gap: 1.5,
          '&:hover .account-actions': { opacity: 1 }
        }}
      >
        <Avatar src={account.picture} sx={{ width: 32, height: 32, bgcolor: color, fontSize: 12, fontWeight: 'bold' }}>
          {!account.picture && getInitials(account.email)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={500} noWrap>
              {account.name || account.email.split('@')[0]}
            </Typography>
            {isExpired && (
              <Chip label="expired" size="small" color="warning" sx={{ height: 16, fontSize: '0.65rem' }} />
            )}
          </Box>
          
          {storage && (
            <Box sx={{ mt: 0.5 }}>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, storage.usedPercent)} 
                color={storage.usedPercent > 80 ? 'error' : 'primary'}
                sx={{ height: 4, borderRadius: 2 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.25 }}>
                {formatFileSize(storage.used)} / {formatFileSize(storage.limit)}
              </Typography>
            </Box>
          )}
        </Box>

        <Box className="account-actions" sx={{ display: 'flex', gap: 0.5, opacity: { xs: 1, sm: 0 }, transition: 'opacity 0.2s' }}>
          {isExpired ? (
            <Chip
              icon={<PlugZap size={12} />}
              label={reconnecting ? 'Reconnecting…' : 'Re-connect'}
              size="small"
              color="warning"
              onClick={handleReconnect}
              disabled={reconnecting}
              sx={{ cursor: 'pointer' }}
            />
          ) : (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRefresh?.(account.email); }}>
              <RefreshCw size={14} />
            </IconButton>
          )}
          <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}>
            <X size={14} />
          </IconButton>
        </Box>
      </ListItemButton>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Disconnect account?"
        description={`This will remove ${account.email} and all its files from DriveUnify. The files in Google Drive are not affected.`}
        confirmLabel="Disconnect"
        confirmVariant="danger"
        loading={disconnecting}
        onConfirm={handleDisconnect}
      />
    </>
  );
};
