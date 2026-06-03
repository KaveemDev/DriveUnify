import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { getFile } from '../../api/googleDriveApi';
import { Cloud, Plus, RefreshCw, SortAsc, SortDesc } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { FileGrid } from '../../components/explorer/FileGrid';
import { FileList } from '../../components/explorer/FileList';
import { FileBreadcrumb } from '../../components/explorer/FileBreadcrumb';
import { FileContextMenu } from '../../components/explorer/FileContextMenu';
import { RenameModal } from '../../components/modals/RenameModal';
import { FilePreviewModal } from '../../components/modals/FilePreviewModal';
import { TransferModal } from '../../components/modals/TransferModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { UploadZone } from '../../components/upload/UploadZone';
import { setConnectModalOpen } from '../../store/slices/uiSlice';
import { setSortBy, setSortDir } from '../../store/slices/driveSlice';
import { useDrive } from '../../hooks/useDrive';
import { useSearch } from '../../hooks/useSearch';
import { VIEW_MODES, SORT_OPTIONS } from '../../config/constants';
import { isFolder } from '../../utils/helpers';
import { Box, Typography, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';

const SkeletonCard = () => (
  <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
    <Box sx={{ height: 128, bgcolor: 'action.selected', animation: 'pulse 1.5s infinite' }} />
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ height: 12, borderRadius: 1, bgcolor: 'action.selected', animation: 'pulse 1.5s infinite' }} />
      <Box sx={{ height: 12, width: '66%', borderRadius: 1, bgcolor: 'action.selected', animation: 'pulse 1.5s infinite' }} />
    </Box>
  </Box>
);

const SkeletonGrid = () => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1.5, p: 2 }}>
    {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
  </Box>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    connectedAccounts, loading, viewMode, sortBy, sortDir,
  } = useSelector(s => s.drive);

  const { filteredFiles, totalCount, filteredCount } = useSearch();
  const {
    fetchFilesForAllAccounts, navigateToFolder, navigateToRoot,
    renameFileAction, deleteFileAction, permanentlyDeleteFileAction, toggleStar,
  } = useDrive();

  const [contextMenu, setContextMenu] = useState({ open: false, file: null, x: 0, y: 0 });
  const [renameModal, setRenameModal] = useState({ open: false, file: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, file: null, permanent: false });
  const [previewFile, setPreviewFile] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [transferModal, setTransferModal] = useState({ open: false, file: null });

  useEffect(() => {
    if (connectedAccounts.length > 0) {
      fetchFilesForAllAccounts();
    }
  }, [connectedAccounts.length]);

  useEffect(() => {
    const shareId = searchParams.get('share');
    if (shareId && connectedAccounts.length > 0) {
      const fetchSharedFile = async () => {
        let foundFile = null;
        for (const account of connectedAccounts) {
          try {
            const file = await getFile(account.accessToken, shareId, account.email);
            if (file) {
              foundFile = file;
              foundFile.accountEmail = account.email;
              break;
            }
          } catch (err) {
            // Ignore error and try next account
          }
        }
        
        if (foundFile) {
          setPreviewFile(foundFile);
        } else {
          toast.error('You do not have access to this shared file');
        }
        
        searchParams.delete('share');
        setSearchParams(searchParams);
      };
      
      fetchSharedFile();
    }
  }, [searchParams, connectedAccounts, setSearchParams]);

  const handleFileClick = useCallback((file) => {
    if (isFolder(file)) {
      navigateToFolder(file, file.accountEmail);
    } else {
      setPreviewFile(file);
    }
  }, [navigateToFolder]);

  const handleContextMenu = useCallback((e, file) => {
    setContextMenu({ open: true, file, x: e.clientX, y: e.clientY });
  }, []);

  const handleMenuClick = useCallback((e, file) => {
    setContextMenu({ open: true, file, x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, open: false }));
  }, []);

  const handleDelete = (file) => setDeleteConfirm({ open: true, file, permanent: false });
  const handlePermanentDelete = (file) => setDeleteConfirm({ open: true, file, permanent: true });
  const handleRename = (file) => setRenameModal({ open: true, file });
  const handleCopyToDrive = useCallback((file) => setTransferModal({ open: true, file }), []);

  const confirmDelete = async () => {
    const { file, permanent } = deleteConfirm;
    setDeleteConfirm({ open: false, file: null, permanent: false });
    if (permanent) {
      await permanentlyDeleteFileAction(file);
    } else {
      await deleteFileAction(file);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      dispatch(setSortDir(sortDir === 'asc' ? 'desc' : 'asc'));
    } else {
      dispatch(setSortBy(field));
      dispatch(setSortDir('asc'));
    }
    setSortAnchor(null);
  };

  if (!loading && connectedAccounts.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <EmptyState
          icon={Cloud}
          title="Connect your first Google Drive"
          description="Add a Google Drive account to start managing all your files from one unified dashboard."
          action={{
            label: 'Connect Google Drive',
            icon: Plus,
            onClick: () => dispatch(setConnectModalOpen(true)),
          }}
        />
      </Box>
    );
  }

  return (
    <UploadZone>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderBottom: 1, borderColor: 'divider', flexShrink: 0, flexWrap: 'wrap' }}>
          <FileBreadcrumb onNavigateRoot={navigateToRoot} />
          
          <Box sx={{ flex: 1 }} />

          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {filteredCount !== totalCount ? `${filteredCount} of ${totalCount}` : `${totalCount}`} files
          </Typography>

          <Box>
            <IconButton size="small" onClick={(e) => setSortAnchor(e.currentTarget)} sx={{ borderRadius: 1, px: 1 }}>
              {sortDir === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              <Typography variant="caption" sx={{ ml: 0.5 }}>{SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'}</Typography>
            </IconButton>
            <Menu anchorEl={sortAnchor} open={!!sortAnchor} onClose={() => setSortAnchor(null)}>
              {SORT_OPTIONS.map(opt => (
                <MenuItem key={opt.value} onClick={() => toggleSort(opt.value)} selected={sortBy === opt.value}>
                  <ListItemText>{opt.label}</ListItemText>
                  {sortBy === opt.value && <ListItemIcon sx={{ minWidth: 'auto', ml: 2 }}>{sortDir === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}</ListItemIcon>}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <IconButton size="small" onClick={fetchFilesForAllAccounts} title="Refresh all">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {loading && filteredFiles.length === 0 ? (
            <SkeletonGrid />
          ) : filteredFiles.length === 0 ? (
            <EmptyState icon={Cloud} title="No files found" description="Try a different search term or connect another Google Drive account." />
          ) : viewMode === VIEW_MODES.GRID ? (
            <Box sx={{ height: '100%' }}>
              <FileGrid files={filteredFiles} onFileClick={handleFileClick} onContextMenu={handleContextMenu} onMenuClick={handleMenuClick} />
            </Box>
          ) : (
            <FileList files={filteredFiles} onFileClick={handleFileClick} onContextMenu={handleContextMenu} onRename={handleRename} onDelete={handleDelete} />
          )}
        </Box>

        <FileContextMenu
          file={contextMenu.file}
          position={contextMenu.open ? { x: contextMenu.x, y: contextMenu.y } : null}
          open={contextMenu.open}
          onClose={closeContextMenu}
          onPreview={(f) => setPreviewFile(f)}
          onRename={handleRename}
          onDelete={handleDelete}
          onPermanentDelete={handlePermanentDelete}
          onToggleStar={toggleStar}
          onCopyToDrive={handleCopyToDrive}
          connectedAccounts={connectedAccounts}
          onDownload={(f) => {
            const account = connectedAccounts.find(a => a.email === f.accountEmail);
            if (!account) return;
            const url = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`;
            fetch(url, { headers: { Authorization: `Bearer ${account.accessToken}` } })
              .then(r => r.blob())
              .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = f.name;
                a.click();
              });
          }}
        />

        <RenameModal open={renameModal.open} onOpenChange={(o) => setRenameModal(prev => ({ ...prev, open: o }))} file={renameModal.file} onRename={renameFileAction} />

        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(o) => setDeleteConfirm(prev => ({ ...prev, open: o }))}
          title={deleteConfirm.permanent ? 'Permanently delete?' : 'Move to trash?'}
          description={deleteConfirm.permanent ? `"${deleteConfirm.file?.name}" will be permanently deleted and cannot be recovered.` : `"${deleteConfirm.file?.name}" will be moved to Google Drive trash.`}
          confirmLabel={deleteConfirm.permanent ? 'Delete Forever' : 'Move to Trash'}
          confirmVariant="danger"
          onConfirm={confirmDelete}
        />

        {previewFile && (
          <FilePreviewModal file={previewFile} files={filteredFiles.filter(f => !isFolder(f))} onClose={() => setPreviewFile(null)} onNavigate={setPreviewFile} />
        )}

        <TransferModal
          open={transferModal.open}
          onOpenChange={(o) => setTransferModal(prev => ({ ...prev, open: o }))}
          file={transferModal.file}
        />
      </Box>
    </UploadZone>
  );
};

export default Dashboard;
