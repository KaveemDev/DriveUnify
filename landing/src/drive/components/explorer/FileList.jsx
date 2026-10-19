import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FileRow } from './FileRow';
import { toggleFileSelection, selectAll, clearSelection } from '../../store/slices/driveSlice';
import { openInGoogleDrive, downloadFile } from '../../utils/helpers';
import { Check, Cloud } from 'lucide-react';

export const FileList = ({
  files,
  onFileClick,
  onContextMenu,
  onRename,
  onDelete,
  onFileDetails,
}) => {
  const dispatch = useDispatch();
  const { selectedFiles, connectedAccounts } = useSelector((s) => s.drive);
  const { activeNav } = useSelector((s) => s.ui);

  const getAccount = (email) => connectedAccounts?.find((a) => a.email === email);
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-bg-surface)',
        overflow: 'hidden',
      }}
    >
      {/* ── Sticky Table Header ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '36px 30px minmax(200px, 3fr) minmax(130px, 1.2fr) minmax(100px, 1fr) minmax(80px, 0.8fr) 120px',
          alignItems: 'center',
          padding: '0 16px',
          height: 36,
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)',
          flexShrink: 0,
          fontSize: '0.72rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
        className="file-table-row-grid"
      >
        {/* Select All Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            onClick={handleToggleSelectAll}
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              border: `1.5px solid ${allSelected ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
              background: allSelected ? 'var(--color-accent)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected && <Check size={10} strokeWidth={2.5} color="var(--color-accent-fg)" />}
          </div>
        </div>

        {/* Icon placeholder */}
        <div />

        {/* Name */}
        <div>File name</div>

        {/* Provider */}
        <div className="hidden md:block">Provider</div>

        {/* Last Modified */}
        <div className="hidden sm:block">Modified</div>

        {/* Size */}
        <div className="hidden sm:block">Size</div>

        {/* Actions header */}
        <div style={{ textAlign: 'right' }}>Actions</div>
      </div>

      {/* ── Table Rows ── */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
        {files.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '64px 24px',
              gap: 8,
              color: 'var(--color-text-muted)',
            }}
          >
            <Cloud size={32} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              {getEmptyState().title}
            </div>
            <div style={{ fontSize: '0.78rem' }}>
              {getEmptyState().desc}
            </div>
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
              onRename={onRename}
              onDelete={onDelete}
              onFileDetails={onFileDetails}
              onDownload={(f) => {
                const account = getAccount(f.accountEmail);
                if (account) {
                  const url = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`;
                  downloadFile(url, f.name, account.accessToken);
                }
              }}
              onOpenInDrive={(f) => openInGoogleDrive(f)}
            />
          ))
        )}
      </div>
    </div>
  );
};
