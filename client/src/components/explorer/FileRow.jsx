import { Download, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Box, Typography, Checkbox, IconButton, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { FileIcon } from './FileIcon';
import { formatFileSize, formatRelativeDate, getMimeLabel } from '../../utils/formatters';
import { getAccountColor } from '../../config/constants';
import { isFolder } from '../../utils/helpers';

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } }
};

export const FileRow = ({
  file,
  selected,
  onSelect,
  onClick,
  onContextMenu,
  onDownload,
  onRename,
  onDelete,
  onOpenInDrive,
}) => {
  const isDir = isFolder(file);

  return (
    <motion.div variants={itemVariants} layout>
      <Box
        className="group"
        sx={{
          display: 'flex', alignItems: 'center', px: 2, py: 1,
          borderBottom: 1, borderColor: 'divider',
          bgcolor: selected ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) { onSelect?.(file); } 
          else { onClick?.(file); }
        }}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu?.(e, file); }}
      >
        <Box sx={{ width: 40, flexShrink: 0 }}>
          <Checkbox 
            checked={selected} 
            onChange={(e) => { e.stopPropagation(); onSelect?.(file); }}
            onClick={(e) => e.stopPropagation()}
            size="small"
            sx={{ opacity: selected ? 1 : 0, '.group:hover &': { opacity: 1 } }}
          />
        </Box>

        <Box sx={{ width: 32, flexShrink: 0 }}>
          <FileIcon category={file.category} size={24} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={500} noWrap>{file.name}</Typography>
        </Box>

        <Box sx={{ width: 160, display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getAccountColor(file.accountEmail) }} />
          <Typography variant="caption" color="text.secondary" noWrap>{file.accountEmail}</Typography>
        </Box>

        <Box sx={{ width: 120, display: { xs: 'none', lg: 'block' } }}>
          <Typography variant="caption" color="text.secondary">{getMimeLabel(file.mimeType)}</Typography>
        </Box>

        <Box sx={{ width: 80, textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">{!isDir ? formatFileSize(file.size) : '—'}</Typography>
        </Box>

        <Box sx={{ width: 120, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="caption" color="text.secondary">{formatRelativeDate(file.modifiedTime)}</Typography>
        </Box>

        <Box sx={{ width: 140, display: 'flex', justifyContent: 'flex-end', opacity: { xs: 1, sm: 0 }, '.group:hover &': { opacity: 1 }, transition: 'opacity 0.2s' }}>
          {!isDir && (
            <Tooltip title="Download">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDownload?.(file); }}><Download size={16} /></IconButton>
            </Tooltip>
          )}
          <Tooltip title="Rename">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onRename?.(file); }}><Pencil size={16} /></IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete?.(file); }}><Trash2 size={16} /></IconButton>
          </Tooltip>
          <Tooltip title="Open in Drive">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onOpenInDrive?.(file); }}><ExternalLink size={16} /></IconButton>
          </Tooltip>
        </Box>
      </Box>
    </motion.div>
  );
};
