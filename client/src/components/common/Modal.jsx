import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box } from '@mui/material';
import { X } from 'lucide-react';

export const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  size = 'md',
}) => {
  const sizes = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
    xl: 'lg',
    full: 'xl',
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => onOpenChange(false)}
      maxWidth={sizes[size]}
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, bgcolor: 'background.paper', backgroundImage: 'none' }
      }}
    >
      {(title || description) && (
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Box>
            {title && <Typography variant="h6" component="div">{title}</Typography>}
            {description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>}
          </Box>
          <IconButton
            onClick={() => onOpenChange(false)}
            sx={{ ml: 2, color: 'text.secondary' }}
            size="small"
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent sx={{ p: 3, pt: (title || description) ? 3 : 2 }}>
        {children}
      </DialogContent>
    </Dialog>
  );
};
