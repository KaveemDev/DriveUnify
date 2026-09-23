import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FileCard } from './FileCard';
import { toggleFileSelection } from '../../store/slices/driveSlice';
import { Cloud } from 'lucide-react';

export const FileGrid = ({
  files,
  onFileClick,
  onContextMenu,
  onMenuClick,
}) => {
  const dispatch = useDispatch();
  const { selectedFiles } = useSelector((s) => s.drive);
  const { activeNav } = useSelector((s) => s.ui);

  const getEmptyState = () => {
    switch (activeNav) {
      case 'starred':
        return {
          title: 'No starred files',
          desc: 'Star files and folders from your library to access them quickly here.',
        };
      case 'recent':
        return {
          title: 'No recent activity',
          desc: 'Files you open, upload, or modify will appear here.',
        };
      case 'shared':
        return {
          title: 'No shared files',
          desc: 'Items shared with your Google Drive account will be displayed here.',
        };
      case 'trash':
        return {
          title: 'Trash is empty',
          desc: 'Items deleted from your Google Drive will be held here until permanently removed.',
        };
      default:
        return {
          title: 'No files found',
          desc: 'Upload files or drag and drop to start organizing.',
        };
    }
  };

  if (files.length === 0) {
    const empty = getEmptyState();
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          gap: 8,
          color: 'var(--color-text-muted)',
        }}
      >
        <Cloud size={32} style={{ opacity: 0.3 }} />
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {empty.title}
        </div>
        <div style={{ fontSize: '0.78rem' }}>
          {empty.desc}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        overflowY: 'auto',
        height: '100%',
        padding: '16px 20px 32px',
      }}
      className="scrollbar-thin"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        {files.map((file) => (
          <FileCard
            key={file.id + (file.accountEmail || '')}
            file={file}
            selected={selectedFiles.includes(file.id)}
            onSelect={() => dispatch(toggleFileSelection(file.id))}
            onClick={onFileClick}
            onContextMenu={onContextMenu}
            onMenuClick={onMenuClick}
          />
        ))}
      </div>
    </div>
  );
};
