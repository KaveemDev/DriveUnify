import { Modal } from '../common/Modal';
import { Button, TextField, Box } from '@mui/material';
import { Copy, ExternalLink } from 'lucide-react';
import { copyToClipboard, openInGoogleDrive } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const ShareModal = ({ open, onOpenChange, file }) => {
  if (!file) return null;
  const shareUrl = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;

  const handleCopy = async () => {
    await copyToClipboard(shareUrl);
    toast.success('Link copied to clipboard');
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Share File" size="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          value={shareUrl}
          InputProps={{ readOnly: true }}
          variant="outlined"
          size="small"
          fullWidth
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<Copy size={16}/>} onClick={handleCopy} fullWidth disableElevation>
            Copy Link
          </Button>
          <Button variant="outlined" startIcon={<ExternalLink size={16}/>} onClick={() => openInGoogleDrive(file)} fullWidth>
            Open in Drive
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
