import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FileRow } from './FileRow';
import { toggleFileSelection, selectAll, clearSelection } from '../../store/slices/driveSlice';
import { downloadFile, findAccountForFile } from '../../utils/helpers';
import { Cloud } from 'lucide-react';

export const FileList = ({
  files,
  onFileClick,
  onContextMenu,
  onFileDetails,
}) => {
  const dispatch = useDispatch();
  const { selectedFiles, connectedAccounts } = useSelector((s) => s.drive);
  const { activeNav } = useSelector((s) => s.ui);

  const allSelected = files.length > 0 && files.every((f) => selectedFiles.includes(f.id));

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

  const handleToggleSelectAll = () => {
    if (allSelected) {
      dispatch(clearSelection());
    } else {
      dispatch(selectAll(files.map((f) => f.id)));
    }
  };

  const someSelected = !allSelected && files.some((f) => selectedFiles.includes(f.id));
  const empty = getEmptyState();

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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '64px 24px',
              gap: 8,
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Cloud size={32} style={{ opacity: 0.4 }} aria-hidden="true" />
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{empty.title}</div>
            <div style={{ fontSize: '0.8125rem' }}>{empty.desc}</div>
          </div>
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
