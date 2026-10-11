import { Modal } from '../common/Modal';
import { TextField, Box, Typography } from '@mui/material';
import { Button } from '../common/Button';
import { Copy, ExternalLink, Link2, Check } from 'lucide-react';
import { copyToClipboard, openInGoogleDrive } from '../../utils/helpers';
import { useState } from 'react';
import toast from 'react-hot-toast';

export const ShareModal = ({ open, onOpenChange, file }) => {
  const [copied, setCopied] = useState(false);

  if (!file) return null;
  const shareUrl = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;

  const handleCopy = async () => {
    await copyToClipboard(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard', { icon: '🔗' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Share File Link"
      description="Anyone with this link can view or request access in Google Drive."
      size="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', mb: 0.75 }}>
            Public / Drive Link
          </Typography>
          <TextField
            value={shareUrl}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', mr: 1 }}>
                  <Link2 size={16} />
                </Box>
              ),
            }}
            variant="outlined"
            size="small"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'action.hover',
                fontSize: '0.8125rem',
              },
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.25,
            pt: 0.5,
          }}
        >
          <Button
            variant={copied ? 'secondary' : 'primary'}
            icon={copied ? Check : Copy}
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? 'Copied to Clipboard' : 'Copy Link'}
          </Button>
          <Button
            variant="outline"
            icon={ExternalLink}
            onClick={() => openInGoogleDrive(file)}
            className="flex-1"
          >
            Open in Drive
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

