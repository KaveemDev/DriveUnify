import { useState } from 'react';
import { Modal } from '../common/Modal';
import { FolderPlus, Loader2, Folder, User } from 'lucide-react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from '@mui/material';
import { Button } from '../common/Button';
import toast from 'react-hot-toast';
import { createFolder } from '../../api/googleDriveApi';
import { getAccountColor } from '../../config/constants';
import { getInitials } from '../../utils/formatters';

export const CreateFolderModal = ({
  open,
  onOpenChange,
  currentFolder,
  connectedAccounts = [],
  onFolderCreated,
}) => {
  const [folderName, setFolderName] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(
    currentFolder?.accountEmail || connectedAccounts[0]?.email || ''
  );
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = folderName.trim();
    if (!name) return;

    const account = connectedAccounts.find((a) => a.email === selectedEmail) || connectedAccounts[0];
    if (!account) {
      toast.error('No connected account found');
      return;
    }

    setLoading(true);
    try {
      const parentId = currentFolder?.id || 'root';
      const created = await createFolder(account.accessToken, name, parentId, account.email);
      toast.success(`Folder "${name}" created`, { icon: '📁' });
      onFolderCreated?.({ ...created, accountEmail: account.email });
      setFolderName('');
      onOpenChange(false);
    } catch (err) {
      toast.error(`Failed to create folder: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Folder"
      description={
        currentFolder
          ? `Will be created inside "${currentFolder.name || 'Current Folder'}"`
          : 'Create a new directory in your connected Google Drive.'
      }
      size="sm"
    >
      <form onSubmit={handleCreate}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
          {/* Folder name input */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', mb: 0.75 }}>
              Folder Name
            </Typography>
            <TextField
              autoFocus
              required
              fullWidth
              size="small"
              placeholder="e.g. Invoices 2026"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Box sx={{ color: '#f59e0b', display: 'flex', alignItems: 'center', mr: 1 }}>
                    <Folder size={18} />
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  fontSize: '0.875rem',
                },
              }}
            />
          </Box>

          {/* Drive Account Selector if multiple accounts and no parent folder */}
          {connectedAccounts.length > 1 && !currentFolder && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', mb: 0.75 }}>
                Target Google Account
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                    fontSize: '0.85rem',
                  }}
                >
                  {connectedAccounts.map((a) => (
                    <MenuItem key={a.email} value={a.email}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                        <Avatar
                          src={a.picture}
                          sx={{ width: 24, height: 24, bgcolor: getAccountColor(a.email), fontSize: 10 }}
                        >
                          {!a.picture && getInitials(a.email)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={500} noWrap sx={{ fontSize: '0.8rem' }}>
                            {a.name || a.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.68rem' }}>
                            {a.email}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Action buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              gap: 1.25,
              justifyContent: 'flex-end',
              pt: 0.5,
            }}
          >
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || !folderName.trim()}
              loading={loading}
              icon={FolderPlus}
              className="w-full sm:w-auto"
            >
              Create Folder
            </Button>
          </Box>
        </Box>
      </form>
    </Modal>
  );
};

