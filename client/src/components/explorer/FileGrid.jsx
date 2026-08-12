import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FileCard } from './FileCard';
import { toggleFileSelection } from '../../store/slices/driveSlice';

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.04 } }
};

export const FileGrid = ({
  files, onFileClick, onContextMenu, onMenuClick,
}) => {
  const dispatch = useDispatch();
  const { selectedFiles } = useSelector(s => s.drive);

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '12px 16px 24px' }} className="scrollbar-thin">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 10,
          paddingTop: 4,
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
      </motion.div>
    </div>
  );
};
