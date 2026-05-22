import { Button, Box, Typography } from '@mui/material';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400, gap: 3, textAlign: 'center', px: 2 }}>
      {/* SVG illustration circle */}
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ height: 112, width: 112, borderRadius: '50%', bgcolor: 'action.hover', border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ height: 80, width: 80, borderRadius: '50%', bgcolor: 'action.selected', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {Icon && <Icon size={36} color="text.secondary" strokeWidth={1.5} />}
          </Box>
        </Box>
        <Box sx={{ position: 'absolute', top: -4, right: -4, height: 16, width: 16, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.3 }} />
        <Box sx={{ position: 'absolute', bottom: -8, left: -8, height: 12, width: 12, borderRadius: '50%', bgcolor: 'secondary.main', opacity: 0.3 }} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 320 }}>
        <Typography variant="h6" fontWeight="bold">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">{description}</Typography>
        )}
      </Box>

      {action && (
        <Button
          variant="contained"
          color={action.variant === 'danger' ? 'error' : 'primary'}
          startIcon={action.icon && <action.icon size={18} />}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
};
