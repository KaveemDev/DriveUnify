import { useSelector, useDispatch } from 'react-redux';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { FileCard } from './FileCard';
import { toggleFileSelection } from '../../store/slices/driveSlice';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

export const FileGrid = ({
  files,
  onFileClick,
  onContextMenu,
  onMenuClick,
}) => {
  const dispatch = useDispatch();
  const { selectedFiles } = useSelector(s => s.drive);

  return (
    <Box sx={{ overflowY: 'auto', height: '100%', px: 2, pb: 4 }}>
      <Box 
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 2,
          pt: 1
        }}
      >
        {files.map(file => (
          <FileCard
            key={file.id + file.accountEmail}
            file={file}
            selected={selectedFiles.includes(file.id)}
            onSelect={() => dispatch(toggleFileSelection(file.id))}
            onClick={onFileClick}
            onContextMenu={onContextMenu}
            onMenuClick={onMenuClick}
          />
        ))}
      </Box>
    </Box>
  );
};
