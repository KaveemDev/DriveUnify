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
  maxWidth,
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
      maxWidth={maxWidth || sizes[size]}
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(5, 5, 8, 0.65)',
          },
        },
      }}
      PaperProps={{
        className,
        sx: {
          borderRadius: { xs: 3, sm: 3.5 },
          bgcolor: 'background.paper',
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 24px 70px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          m: { xs: 1.5, sm: 2 },
          maxHeight: { xs: 'calc(100dvh - 24px)', sm: 'calc(100vh - 48px)' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {(title || description) && (
        <DialogTitle
          sx={{
            m: 0,
            px: { xs: 2.25, sm: 3 },
            py: { xs: 2, sm: 2.25 },
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
            background: 'transparent',
            flexShrink: 0,
          }}
        >
          <Box sx={{ pr: 1 }}>
            {title && (
              <Typography
                variant="subtitle1"
                component="div"
                fontWeight={600}
                sx={{
                  color: 'text.primary',
                  lineHeight: 1.3,
                  fontSize: { xs: '0.95rem', sm: '1.05rem' },
                }}
              >
                {title}
              </Typography>
            )}
            {description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  lineHeight: 1.4,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => onOpenChange(false)}
            size="small"
            aria-label="Close dialog"
            sx={{
              color: 'text.secondary',
              p: 0.75,
              borderRadius: 1.5,
              transition: 'all 0.15s ease',
              '&:hover': {
                color: 'text.primary',
                bgcolor: 'action.selected',
              },
            }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent
        sx={{
          p: { xs: 2.25, sm: 3 },
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
};

