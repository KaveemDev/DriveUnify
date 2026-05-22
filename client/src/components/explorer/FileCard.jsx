import { useState } from 'react';
import { MoreHorizontal, Star } from 'lucide-react';
import { Box, Card, CardActionArea, CardMedia, Typography, Checkbox, IconButton, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { FileIcon } from './FileIcon';
import { formatFileSize, formatRelativeDate } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';
import { isFolder } from '../../utils/helpers';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export const FileCard = ({
  file,
  selected,
  onSelect,
  onClick,
  onContextMenu,
  onMenuClick,
}) => {
  const theme = useTheme();
  const [imgError, setImgError] = useState(false);
  const isDir = isFolder(file);
  const hasThumbnail = file.thumbnailLink && !imgError;

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4 }} layout>
      <Card
        variant="outlined"
        sx={{
          position: 'relative',
          borderColor: selected ? 'primary.main' : 'divider',
          borderWidth: selected ? 2 : 1,
          bgcolor: selected ? 'action.selected' : 'background.paper',
          transition: 'all 0.2s',
          overflow: 'visible'
        }}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, file); }}
      >
        <CardActionArea 
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) { onSelect?.(file); } 
            else { onClick?.(file); }
          }}
          onDoubleClick={() => isDir && onClick?.(file)}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          {/* Thumbnail / Icon Area */}
          <Box sx={{ 
            height: isDir ? 100 : 140, 
            bgcolor: 'action.hover', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative'
          }}>
            {hasThumbnail ? (
              <CardMedia
                component="img"
                image={file.thumbnailLink}
                alt={file.name}
                sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
                onError={() => setImgError(true)}
              />
            ) : (
              <FileIcon category={file.category} size={isDir ? 48 : 56} />
            )}
            
            {/* Star badge */}
            {file.starred && (
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <Star size={16} fill={theme.palette.warning.main} color={theme.palette.warning.main} />
              </Box>
            )}
          </Box>

          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" fontWeight={500} noWrap title={file.name}>
              {file.name}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {!isDir ? formatFileSize(file.size) : '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatRelativeDate(file.modifiedTime)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getAccountColor(file.accountEmail) }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {file.accountEmail.split('@')[0]}
              </Typography>
            </Box>
          </Box>
        </CardActionArea>

        {/* Floating actions */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
          <Checkbox 
            checked={selected} 
            onChange={(e) => { e.stopPropagation(); onSelect?.(file); }}
            onClick={(e) => e.stopPropagation()}
            size="small"
            sx={{ 
              p: 0.5, 
              bgcolor: selected ? 'background.paper' : 'transparent',
              opacity: selected ? 1 : 0,
              '.MuiCard-root:hover &': { opacity: 1 },
              '&.Mui-checked': { color: 'primary.main', bgcolor: 'background.paper' }
            }}
          />
        </Box>

        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onMenuClick?.(e, file); }}
          sx={{ 
            position: 'absolute', 
            bottom: 8, 
            right: 8, 
            zIndex: 1,
            opacity: 0,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '.MuiCard-root:hover &': { opacity: 1 }
          }}
        >
          <MoreHorizontal size={16} />
        </IconButton>
      </Card>
    </motion.div>
  );
};
