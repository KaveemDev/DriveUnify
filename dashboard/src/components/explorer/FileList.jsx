import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FileRow } from './FileRow';
import { toggleFileSelection, selectAll, clearSelection } from '../../store/slices/driveSlice';
import { downloadFile, findAccountForFile } from '../../utils/helpers';
import { FilesEmptyState } from './FilesEmptyState';

export const FileList = ({
  files,
  onFileClick,
  onContextMenu,
  onFileDetails,
  loading,
  filtered,
  onClearFilters,
}) => {
  const dispatch = useDispatch();
  const { selectedFiles, connectedAccounts } = useSelector((s) => s.drive);
  const { activeNav } = useSelector((s) => s.ui);

  const allSelected = files.length > 0 && files.every((f) => selectedFiles.includes(f.id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      dispatch(clearSelection());
    } else {
      dispatch(selectAll(files.map((f) => f.id)));
    }
  };

  const someSelected = !allSelected && files.some((f) => selectedFiles.includes(f.id));

  return (
    <div className="du-card" style={{ overflow: 'clip' }}>
      <div className="du-table-row du-table-head">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            className="du-check"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected; }}
            onChange={handleToggleSelectAll}
            disabled={files.length === 0}
            aria-label={allSelected ? 'Deselect all' : 'Select all'}
          />
        </div>
        <div>Name</div>
        <div className="du-col-md">Drive</div>
        <div className="du-col-sm">Modified</div>
        <div className="du-col-sm" style={{ textAlign: 'right' }}>Size</div>
        <div />
      </div>

      <div className="du-table-body">
        {files.length === 0 ? (
          <FilesEmptyState activeNav={activeNav} loading={loading} filtered={filtered} onClearFilters={onClearFilters} />
        ) : (
          files.map((file) => (
            <FileRow
              key={file.id + (file.accountEmail || '')}
              file={file}
              selected={selectedFiles.includes(file.id)}
              onSelect={() => dispatch(toggleFileSelection(file.id))}
              onClick={onFileClick}
              onContextMenu={onContextMenu}
              onFileDetails={onFileDetails}
              onDownload={(f) => {
                const account = findAccountForFile(connectedAccounts, f);
                if (account) {
                  const url = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`;
                  downloadFile(url, f.name, account.accessToken);
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
