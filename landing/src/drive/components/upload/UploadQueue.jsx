import { useSelector, useDispatch } from 'react-redux';
import { Minus, X } from 'lucide-react';
import { Box, Typography, IconButton, Paper, Button, Collapse } from '@mui/material';
import { UploadProgressItem } from './UploadProgressItem';
import { useUpload } from '../../hooks/useUpload';
import { setMinimized, removeUpload } from '../../store/slices/uploadSlice';

export const UploadQueue = () => {
  const dispatch = useDispatch();
  const { uploads, progress, errors, isMinimized } = useSelector(s => s.upload);
  const { cancelUploadAction, retryUpload, clearCompletedUploads } = useUpload();

  if (uploads.length === 0) return null;

  const activeCount = uploads.filter(u => u.status === 'uploading' || u.status === 'pending').length;
  const completedCount = uploads.filter(u => u.status === 'complete' || u.status === 'cancelled').length;

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 9990, width: 320,
        borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: isMinimized ? 0 : 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeCount > 0 && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 2s infinite' }} />}
          <Typography variant="subtitle2" fontWeight="bold">Uploads ({uploads.length})</Typography>
          {activeCount > 0 && <Typography variant="caption" color="text.secondary">{activeCount} active</Typography>}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" onClick={() => dispatch(setMinimized(!isMinimized))} title={isMinimized ? 'Expand' : 'Minimize'}>
            <Minus size={16} />
          </IconButton>
          <IconButton size="small" onClick={() => {
            dispatch({ type: 'upload/clearAll' });
            uploads.forEach(u => dispatch(removeUpload(u.id)));
          }} title="Close">
            <X size={16} />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={!isMinimized}>
        <Box sx={{ p: 2, maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {uploads.map(upload => (
            <UploadProgressItem
              key={upload.id}
              upload={upload}
              progress={progress[upload.id]}
              error={errors[upload.id]}
              onCancel={cancelUploadAction}
              onRetry={retryUpload}
              onRemove={(id) => dispatch(removeUpload(id))}
            />
          ))}
        </Box>
        {completedCount > 0 && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Button fullWidth size="small" variant="text" color="inherit" onClick={clearCompletedUploads} sx={{ textTransform: 'none' }}>
              Clear {completedCount} completed
            </Button>
          </Box>
        )}
      </Collapse>
    </Paper>
  );
};
