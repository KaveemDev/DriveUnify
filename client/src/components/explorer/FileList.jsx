import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { FileRow } from './FileRow';
import { toggleFileSelection } from '../../store/slices/driveSlice';
import { openInGoogleDrive, downloadFile } from '../../utils/helpers';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
};

export const FileList = ({
  files,
  onFileClick,
  onContextMenu,
  onRename,
  onDelete,
}) => {
  const dispatch = useDispatch();
  const { selectedFiles, connectedAccounts } = useSelector(s => s.drive);

  const getAccount = (email) => connectedAccounts?.find(a => a.email === email);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ 
        display: 'flex', alignItems: 'center', px: 2, py: 1.5, 
        borderBottom: 1, borderColor: 'divider', 
        bgcolor: 'action.hover' 
      }}>
        <Box sx={{ width: 40, flexShrink: 0 }} />
        <Box sx={{ width: 32, flexShrink: 0 }} />
        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ flex: 1 }}>Name</Typography>
        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ width: 160, display: { xs: 'none', md: 'block' } }}>Account</Typography>
        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ width: 120, display: { xs: 'none', lg: 'block' } }}>Type</Typography>
        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ width: 80, textAlign: 'right' }}>Size</Typography>
        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ width: 120, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>Modified</Typography>
        <Box sx={{ width: 140 }} />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Box component={motion.div} variants={containerVariants} initial="hidden" animate="show">
          {files.map(file => (
            <FileRow
              key={file.id + file.accountEmail}
              file={file}
              selected={selectedFiles.includes(file.id)}
              onSelect={() => dispatch(toggleFileSelection(file.id))}
              onClick={onFileClick}
              onContextMenu={onContextMenu}
              onRename={onRename}
              onDelete={onDelete}
              onDownload={(f) => {
                const account = getAccount(f.accountEmail);
                if (account) {
                  const url = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`;
                  downloadFile(url, f.name, account.accessToken);
                }
              }}
              onOpenInDrive={(f) => openInGoogleDrive(f)}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};
