import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FileCard } from './FileCard';
import { toggleFileSelection } from '../../store/slices/driveSlice';
import { Cloud } from 'lucide-react';
import { isFolder } from '../../utils/helpers';

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

  const folders = files.filter(isFolder);
  const regularFiles = files.filter((f) => !isFolder(f));
  const renderCard = (file) => (
    <FileCard
      key={file.id + (file.accountEmail || '')}
      file={file}
      selected={selectedFiles.includes(file.id)}
      onSelect={() => dispatch(toggleFileSelection(file.id))}
      onClick={onFileClick}
      onContextMenu={onContextMenu}
      onMenuClick={onMenuClick}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {folders.length > 0 && (
        <>
          <h3 className="du-group-label">Folders</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {folders.map(renderCard)}
          </div>
        </>
      )}
      {regularFiles.length > 0 && (
        <>
          <h3 className="du-group-label" style={{ marginTop: folders.length > 0 ? 8 : 0 }}>Files</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
            {regularFiles.map(renderCard)}
          </div>
        </>
      )}
    </div>
  );
};
