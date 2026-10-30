import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FileCard } from './FileCard';
import { toggleFileSelection } from '../../store/slices/driveSlice';
import { FilesEmptyState } from './FilesEmptyState';
import { isFolder } from '../../utils/helpers';

export const FileGrid = ({
  files,
  onFileClick,
  onContextMenu,
  onMenuClick,
  loading,
  filtered,
  onClearFilters,
}) => {
  const dispatch = useDispatch();
  const { selectedFiles } = useSelector((s) => s.drive);
  const { activeNav } = useSelector((s) => s.ui);

  if (files.length === 0) {
    return <FilesEmptyState activeNav={activeNav} loading={loading} filtered={filtered} onClearFilters={onClearFilters} />;
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
