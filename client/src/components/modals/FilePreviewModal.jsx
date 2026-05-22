import { useEffect, useCallback } from 'react';
import { X, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogTitle, IconButton, Box, Typography, Backdrop, Button } from '@mui/material';
import { FileIcon } from '../explorer/FileIcon';
import { formatFileSize, formatDateTime, getMimeLabel } from '../../utils/formatters';
import { openInGoogleDrive, isPreviewableImage, isPreviewableVideo, isGoogleAppsFile } from '../../utils/helpers';
import { useSelector } from 'react-redux';

export const FilePreviewModal = ({ file, files, onClose, onNavigate }) => {
  const { connectedAccounts } = useSelector(s => s.drive);
  const getAccount = (email) => connectedAccounts?.find(a => a.email === email);

  const currentIndex = files?.findIndex(f => f.id === file?.id && f.accountEmail === file?.accountEmail) ?? -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < (files?.length || 0) - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate?.(files[currentIndex - 1]);
  }, [hasPrev, currentIndex, files, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate?.(files[currentIndex + 1]);
  }, [hasNext, currentIndex, files, onNavigate]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrev, handleNext]);

  if (!file) return null;

  const account = getAccount(file.accountEmail);
  const canPreviewImage = isPreviewableImage(file.mimeType);
  const canPreviewVideo = isPreviewableVideo(file.mimeType);
  const isGApp = isGoogleAppsFile(file.mimeType);
  const previewUrl = file.webViewLink;

  const handleDownload = () => {
    if (!account) return;
    const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
    fetch(url, { headers: { Authorization: `Bearer ${account.accessToken}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  return (
    <Dialog 
      open={!!file} 
      onClose={onClose} 
      fullScreen 
      PaperProps={{
        sx: { 
          m: { xs: 2, md: 4 }, 
          height: { xs: 'calc(100% - 32px)', md: 'calc(100% - 64px)' }, 
          borderRadius: 4, 
          bgcolor: 'background.paper',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' } } }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <FileIcon category={file.category} size={24} />
          <Box sx={{ minWidth: 0 }}>
            <DialogTitle sx={{ p: 0, fontSize: '1rem', lineHeight: 1.2, display: 'block' }} noWrap>{file.name}</DialogTitle>
            <Typography variant="caption" color="text.secondary">{getMimeLabel(file.mimeType)} · {formatFileSize(file.size)}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 2 }}>
          {!isGApp && (
            <IconButton onClick={handleDownload} title="Download"><Download size={20} /></IconButton>
          )}
          <IconButton onClick={() => openInGoogleDrive(file)} title="Open in Drive"><ExternalLink size={20} /></IconButton>
          <IconButton onClick={onClose}><X size={20} /></IconButton>
        </Box>
      </Box>

      {/* Preview area */}
      <Box sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', overflow: 'hidden' }}>
        {canPreviewImage ? (
          <Box component="img" src={`https://lh3.googleusercontent.com/d/${file.id}`} alt={file.name} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = file.thumbnailLink || ''; }} />
        ) : canPreviewVideo ? (
          <Box component="video" src={`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`} controls sx={{ maxWidth: '100%', maxHeight: 'calc(100% - 32px)' }} />
        ) : previewUrl ? (
          <Box component="iframe" src={previewUrl.replace('/view', '/preview')} sx={{ width: '100%', height: '100%', border: 0 }} allow="autoplay" title={file.name} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textAlign: 'center', p: 4 }}>
            <FileIcon category={file.category} size={72} />
            <Box>
              <Typography variant="h6" mb={0.5}>{file.name}</Typography>
              <Typography variant="body2" color="text.secondary">{getMimeLabel(file.mimeType)}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>{formatFileSize(file.size)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!isGApp && <Button variant="contained" startIcon={<Download size={16}/>} onClick={handleDownload}>Download</Button>}
              <Button variant="outlined" startIcon={<ExternalLink size={16}/>} onClick={() => openInGoogleDrive(file)}>Open in Drive</Button>
            </Box>
          </Box>
        )}

        {hasPrev && (
          <IconButton onClick={handlePrev} sx={{ position: 'absolute', left: 16, bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}>
            <ChevronLeft size={24} />
          </IconButton>
        )}
        {hasNext && (
          <IconButton onClick={handleNext} sx={{ position: 'absolute', right: 16, bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}>
            <ChevronRight size={24} />
          </IconButton>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary">Modified: {formatDateTime(file.modifiedTime)}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'inline' } }}>Account: {file.accountEmail}</Typography>
        {files?.length > 1 && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{currentIndex + 1} / {files.length}</Typography>
        )}
      </Box>
    </Dialog>
  );
};
