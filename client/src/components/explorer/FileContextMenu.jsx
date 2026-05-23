import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import {
  Download, Pencil, Star, StarOff, Trash2,
  Trash, ExternalLink, Copy, Eye, CopyPlus,
} from 'lucide-react';
import { isFolder, isGoogleAppsFile } from '../../utils/helpers';
import { copyToClipboard, openInGoogleDrive } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const FileContextMenu = ({
  file,
  position,
  open,
  onClose,
  onPreview,
  onRename,
  onDelete,
  onPermanentDelete,
  onToggleStar,
  onDownload,
  onCopyToDrive,
  connectedAccounts = [],
}) => {
  if (!file) return null;

  const isDir = isFolder(file);
  const isGApp = isGoogleAppsFile(file.mimeType);

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        position !== null
          ? { top: position.y, left: position.x }
          : undefined
      }
      PaperProps={{
        elevation: 4,
        sx: { minWidth: 220, borderRadius: 2 }
      }}
    >
      <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary', fontWeight: 'bold' }} noWrap>
        {file.name}
      </Typography>
      <Divider sx={{ my: 0.5 }} />

      {!isDir && (
        <MenuItem onClick={() => { onPreview?.(file); onClose?.(); }}>
          <ListItemIcon><Eye size={16} /></ListItemIcon>
          <ListItemText>Preview</ListItemText>
        </MenuItem>
      )}

      {!isGApp && !isDir && (
        <MenuItem onClick={() => { onDownload?.(file); onClose?.(); }}>
          <ListItemIcon><Download size={16} /></ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
      )}

      <MenuItem onClick={() => { openInGoogleDrive(file); onClose?.(); }}>
        <ListItemIcon><ExternalLink size={16} /></ListItemIcon>
        <ListItemText>Open in Drive</ListItemText>
      </MenuItem>

      {file.shared && (
        <MenuItem onClick={() => {
          copyToClipboard(file.webViewLink || '');
          toast.success('Link copied');
          onClose?.();
        }}>
          <ListItemIcon><Copy size={16} /></ListItemIcon>
          <ListItemText>Copy link</ListItemText>
        </MenuItem>
      )}

      <Divider sx={{ my: 0.5 }} />

      {/* Copy to Drive — only show when 2+ accounts are connected */}
      {connectedAccounts.length >= 2 && (
        <MenuItem onClick={() => { onCopyToDrive?.(file); onClose?.(); }} sx={{ color: 'primary.main' }}>
          <ListItemIcon sx={{ color: 'primary.main' }}><CopyPlus size={16} /></ListItemIcon>
          <ListItemText>Copy to Drive →</ListItemText>
        </MenuItem>
      )}

      <Divider sx={{ my: 0.5 }} />

      <MenuItem onClick={() => { onRename?.(file); onClose?.(); }}>
        <ListItemIcon><Pencil size={16} /></ListItemIcon>
        <ListItemText>Rename</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => { onToggleStar?.(file); onClose?.(); }}>
        <ListItemIcon>{file.starred ? <StarOff size={16} /> : <Star size={16} />}</ListItemIcon>
        <ListItemText>{file.starred ? 'Unstar' : 'Star'}</ListItemText>
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      <MenuItem onClick={() => { onDelete?.(file); onClose?.(); }} sx={{ color: 'error.main' }}>
        <ListItemIcon sx={{ color: 'error.main' }}><Trash2 size={16} /></ListItemIcon>
        <ListItemText>Move to Trash</ListItemText>
      </MenuItem>

      <MenuItem onClick={() => { onPermanentDelete?.(file); onClose?.(); }} sx={{ color: 'error.main' }}>
        <ListItemIcon sx={{ color: 'error.main' }}><Trash size={16} /></ListItemIcon>
        <ListItemText>Delete Permanently</ListItemText>
      </MenuItem>
    </Menu>
  );
};
