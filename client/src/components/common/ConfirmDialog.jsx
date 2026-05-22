import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogTitle, DialogActions, Button, Typography, Box } from '@mui/material';

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm?.();
  };

  const isDanger = confirmVariant === 'danger';

  return (
    <Dialog open={open} onClose={() => !loading && onOpenChange(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: 'background.paper', p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDanger ? 'error.main' : 'primary.main', opacity: 0.15, position: 'relative' }}>
          <AlertTriangle size={20} color={isDanger ? '#f44336' : '#2196f3'} style={{ position: 'absolute' }} />
        </Box>
        <Box>
          <Typography variant="h6" component="div">{title}</Typography>
          {description && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{description}</Typography>}
        </Box>
      </DialogTitle>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={() => onOpenChange(false)} color="inherit" disabled={loading}>
          {cancelLabel}
        </Button>
        <Button 
          onClick={handleConfirm} 
          color={isDanger ? 'error' : 'primary'} 
          variant="contained" 
          disabled={loading}
          disableElevation
        >
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
