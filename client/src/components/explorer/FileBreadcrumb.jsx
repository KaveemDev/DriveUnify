import { ChevronRight, Home, HardDrive } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Breadcrumbs, Typography, Chip, Button } from '@mui/material';
import { setCurrentFolder } from '../../store/slices/driveSlice';
import { getAccountColor } from '../../config/constants';

export const FileBreadcrumb = ({ onNavigateRoot }) => {
  const dispatch = useDispatch();
  const { currentFolder } = useSelector(s => s.drive);

  const handleRoot = () => {
    dispatch(setCurrentFolder(null));
    onNavigateRoot?.();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Breadcrumbs separator={<ChevronRight size={14} />} aria-label="breadcrumb">
        <Button
          onClick={handleRoot}
          startIcon={<Home size={14} />}
          size="small"
          sx={{ 
            color: !currentFolder ? 'text.primary' : 'text.secondary',
            textTransform: 'none',
            bgcolor: !currentFolder ? 'action.selected' : 'transparent',
            borderRadius: 2
          }}
        >
          All Files
        </Button>

        {currentFolder && currentFolder.accountEmail && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getAccountColor(currentFolder.accountEmail) }} />
            <Typography variant="body2" color="text.secondary">
              {currentFolder.accountEmail.split('@')[0]}
            </Typography>
          </Box>
        )}

        {currentFolder && (
          <Chip
            icon={<HardDrive size={14} />}
            label={currentFolder.name}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2 }}
          />
        )}
      </Breadcrumbs>
    </Box>
  );
};
