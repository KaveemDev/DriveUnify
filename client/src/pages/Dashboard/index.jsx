import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { getFile } from '../../api/googleDriveApi';
import { Cloud, Plus, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';

import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StorageOverview } from '../../components/dashboard/StorageOverview';
import { DashboardAnalytics } from '../../components/dashboard/DashboardAnalytics';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { RecentFiles } from '../../components/dashboard/RecentFiles';
import { FileToolbar } from '../../components/dashboard/FileToolbar';
import { FileDetailsPanel } from '../../components/dashboard/FileDetailsPanel';
import { CommandPalette } from '../../components/dashboard/CommandPalette';

import { FileGrid } from '../../components/explorer/FileGrid';
import { FileList } from '../../components/explorer/FileList';
import { FileContextMenu } from '../../components/explorer/FileContextMenu';

import { RenameModal } from '../../components/modals/RenameModal';
import { FilePreviewModal } from '../../components/modals/FilePreviewModal';
import { TransferModal } from '../../components/modals/TransferModal';
import { CreateFolderModal } from '../../components/modals/CreateFolderModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { UploadZone } from '../../components/upload/UploadZone';

import { setConnectModalOpen, setActiveNav } from '../../store/slices/uiSlice';
import {
  setSortBy, setSortDir, setViewMode,
  toggleFileSelection, clearSelection, selectAll,
  setSelectedAccount,
} from '../../store/slices/driveSlice';

import { useDrive } from '../../hooks/useDrive';
import { useUpload } from '../../hooks/useUpload';
import { useAuth } from '../../hooks/useAuth';
import { VIEW_MODES } from '../../config/constants';
import { isFolder, downloadFile } from '../../utils/helpers';

/* ── Category Matcher Helper ── */
const getFileCategory = (mimeType = '', category = '') => {
  const m = (mimeType || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (c === 'folder' || m.includes('folder')) return 'folder';
  if (m.includes('document') || m.includes('word') || c === 'doc' || c === 'document') return 'documents';
  if (m.includes('spreadsheet') || m.includes('excel') || m.includes('csv') || c === 'sheet' || c === 'spreadsheet') return 'spreadsheets';
  if (m.includes('pdf') || c === 'pdf') return 'pdfs';
  if (m.includes('image') || m.startsWith('image/') || c === 'image') return 'images';
  return 'other';
};

const VIEW_META = {
  home: { title: null, subtitle: null },
  files: {
    title: 'My Files',
    subtitle: 'Browse all files and folders across your connected Google Drive storage'
  },
  recent: {
    title: 'Recent Files',
    subtitle: 'Files sorted chronologically by most recent modification'
  },
  starred: {
    title: 'Starred Items',
    subtitle: 'Quick access to your important files and flagged documents'
  },
  shared: {
    title: 'Shared with Me',
    subtitle: 'Files and documents shared with your Google Drive accounts'
  },
  trash: {
    title: 'Trash',
    subtitle: 'Deleted items from your Google Drive. Files can be restored or permanently removed'
  }
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    connectedAccounts, files, loading, viewMode,
    sortBy, sortDir, selectedAccount, selectedFiles, currentFolder
  } = useSelector((s) => s.drive);
  const { activeNav } = useSelector((s) => s.ui);

  const {
    fetchFilesForAllAccounts, navigateToFolder, navigateToRoot,
    renameFileAction, deleteFileAction, permanentlyDeleteFileAction, toggleStar,
    restoreFileAction, reconnectAccount,
  } = useDrive();
  const { uploadFiles } = useUpload();

  // ── Local UI State ──
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'documents', 'spreadsheets', 'pdfs', 'images', 'starred'
  const [inViewSearch, setInViewSearch] = useState('');
  const [selectedInspectorFile, setSelectedInspectorFile] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Expired accounts detection
  const expiredAccounts = useMemo(
    () => connectedAccounts.filter((a) => a.expired || a.needsReconnect || !a.accessToken),
    [connectedAccounts]
  );

  // Sync URL ?view= with activeNav in Redux
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['home', 'files', 'recent', 'starred', 'shared', 'trash'].includes(viewParam)) {
      if (viewParam !== activeNav) {
        dispatch(setActiveNav(viewParam));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeNav && activeNav !== 'home') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (next.get('view') !== activeNav) {
          next.set('view', activeNav);
        }
        return next;
      }, { replace: true });
    } else if (activeNav === 'home') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (next.has('view')) {
          next.delete('view');
        }
        return next;
      }, { replace: true });
    }
  }, [activeNav, setSearchParams]);

  // ── Modals & Overlays State ──
  const [contextMenu, setContextMenu] = useState({ open: false, file: null, x: 0, y: 0 });
  const [renameModal, setRenameModal] = useState({ open: false, file: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, file: null, permanent: false });
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [transferModal, setTransferModal] = useState({ open: false, file: null });
  const [createFolderModal, setCreateFolderModal] = useState(false);

  // ── Hidden file & folder picker inputs ──
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Initial load
  useEffect(() => {
    if (connectedAccounts.length > 0) {
      fetchFilesForAllAccounts();
    }
  }, [connectedAccounts.length]);

  // Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Shared file preview link via URL query (?share=xyz)
  useEffect(() => {
    const shareId = searchParams.get('share');
    if (shareId && connectedAccounts.length > 0) {
      const fetchSharedFile = async () => {
        let foundFile = null;
        for (const account of connectedAccounts) {
          try {
            const file = await getFile(account.accessToken, shareId, account.email);
            if (file) {
              foundFile = { ...file, accountEmail: account.email };
              break;
            }
          } catch {}
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

  // ── Upload Handlers ──
  const triggerFileUpload = () => {
    if (connectedAccounts.length === 0) {
      dispatch(setConnectModalOpen(true));
      return;
    }
    fileInputRef.current?.click();
  };

  const triggerFolderUpload = () => {
    if (connectedAccounts.length === 0) {
      dispatch(setConnectModalOpen(true));
      return;
    }
    folderInputRef.current?.click();
  };

  const handleFilesPicked = (e) => {
    if (e.target.files?.length && connectedAccounts.length > 0) {
      const targetAccount = selectedAccount || connectedAccounts[0].email;
      uploadFiles(Array.from(e.target.files), targetAccount, currentFolder?.id);
    }
    e.target.value = '';
  };

  // ── File Click & Context Handlers ──
  const handleFileClick = useCallback(
    (file) => {
      if (isFolder(file)) {
        navigateToFolder(file, file.accountEmail);
      } else {
        setSelectedInspectorFile(file);
      }
    },
    [navigateToFolder]
  );

  const handleContextMenu = useCallback((e, file) => {
    setContextMenu({ open: true, file, x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, open: false }));
  }, []);

  const handleDelete = (file) => setDeleteConfirm({ open: true, file, permanent: false });
  const handlePermanentDelete = (file) => setDeleteConfirm({ open: true, file, permanent: true });
  const handleRename = (file) => setRenameModal({ open: true, file });
  const handleCopyToDrive = useCallback((file) => setTransferModal({ open: true, file }), []);

  const confirmDelete = async () => {
    const { file, permanent } = deleteConfirm;
    setDeleteConfirm({ open: false, file: null, permanent: false });
    if (file) {
      if (selectedInspectorFile?.id === file.id) setSelectedInspectorFile(null);
      if (permanent) await permanentlyDeleteFileAction(file);
      else await deleteFileAction(file);
    }
  };

  const confirmBatchDelete = async () => {
    setBatchDeleteConfirm(false);
    const toDelete = files.filter((f) => selectedFiles.includes(f.id));
    dispatch(clearSelection());
    for (const f of toDelete) {
      try {
        await deleteFileAction(f);
      } catch {}
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      dispatch(setSortDir(sortDir === 'asc' ? 'desc' : 'asc'));
    } else {
      dispatch(setSortBy(field));
      dispatch(setSortDir('asc'));
    }
  };

  const handleDownload = (f) => {
    const account = connectedAccounts.find((a) => a.email === f.accountEmail);
    if (!account) return;
    const url = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`;
    downloadFile(url, f.name, account.accessToken);
  };

  // ── Filtered and Sorted Files Pipeline ──
  const processedFiles = useMemo(() => {
    let result = [...files];

    // Filter by selected drive account if set
    if (selectedAccount) {
      result = result.filter((f) => f.accountEmail === selectedAccount);
    }

    // Filter by primary navigation mode
    if (activeNav === 'recent') {
      result = result.filter((f) => !f.trashed && !isFolder(f));
      result.sort((a, b) => new Date(b.modifiedTime || 0) - new Date(a.modifiedTime || 0));
    } else if (activeNav === 'starred') {
      result = result.filter((f) => !f.trashed && f.starred);
    } else if (activeNav === 'shared') {
      result = result.filter((f) => !f.trashed && f.shared);
    } else if (activeNav === 'trash') {
      result = result.filter((f) => f.trashed);
    } else {
      // Default: 'home' or 'files'
      result = result.filter((f) => !f.trashed);
    }

    // Filter by category tabs
    if (activeFilter !== 'all') {
      if (activeFilter === 'starred') {
        result = result.filter((f) => f.starred);
      } else {
        result = result.filter((f) => getFileCategory(f.mimeType, f.category) === activeFilter);
      }
    }

    // Filter by in-view search query
    if (inViewSearch.trim()) {
      const q = inViewSearch.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.accountEmail?.toLowerCase().includes(q) ||
          f.category?.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'name':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          break;
        case 'modifiedTime':
          valA = new Date(a.modifiedTime || 0).getTime();
          valB = new Date(b.modifiedTime || 0).getTime();
          break;
        case 'size':
          valA = a.size || 0;
          valB = b.size || 0;
          break;
        case 'mimeType':
          valA = a.mimeType || '';
          valB = b.mimeType || '';
          break;
        default:
          return 0;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // Always sort folders first in standard file views
    if (activeNav !== 'recent') {
      result.sort((a, b) => {
        const aDir = isFolder(a);
        const bDir = isFolder(b);
        if (aDir && !bDir) return -1;
        if (!aDir && bDir) return 1;
        return 0;
      });
    }

    return result;
  }, [files, selectedAccount, activeNav, activeFilter, inViewSearch, sortBy, sortDir]);

  // ── Empty State: No connected accounts ──
  if (!loading && connectedAccounts.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <EmptyState
          icon={Cloud}
          title="Connect your first Google Drive"
          description="Add a Google Drive account to start managing all your files from one unified, calm dashboard."
          action={{
            label: 'Connect Google Drive',
            icon: Plus,
            onClick: () => dispatch(setConnectModalOpen(true)),
          }}
        />
      </div>
    );
  }

  return (
    <UploadZone>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          background: 'var(--color-bg-base)',
        }}
      >
        {/* Hidden File and Folder pickers */}
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFilesPicked}
          style={{ display: 'none' }}
        />
        <input
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          ref={folderInputRef}
          onChange={handleFilesPicked}
          style={{ display: 'none' }}
        />

        {/* 1. Contextual Dashboard Header */}
        <DashboardHeader
          user={user}
          loading={loading}
          onRefresh={fetchFilesForAllAccounts}
          onUploadFiles={triggerFileUpload}
          onUploadFolder={triggerFolderUpload}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          unreadCount={0}
          title={VIEW_META[activeNav]?.title}
          subtitle={VIEW_META[activeNav]?.subtitle}
        />

        {/* Expired / Reconnect Required Accounts Banner */}
        {expiredAccounts.length > 0 && (
          <div
            style={{
              margin: '12px 24px 0',
              padding: '10px 16px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
                Google Drive session expired for{' '}
                <strong>{expiredAccounts.map((a) => a.email).join(', ')}</strong>.
                Re-authenticate to resume syncing your files.
              </span>
            </div>
            <button
              onClick={() => reconnectAccount(expiredAccounts[0].email)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
            >
              <RefreshCw size={13} />
              Reconnect Account
            </button>
          </div>
        )}

        {/* Scrollable Center Work Area */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            id="dashboard-main-scroll"
            className="scrollbar-thin"
          >
            {/* 2. Prominent Quick Actions Module (shown on Home view when at root) */}
            {activeNav === 'home' && !currentFolder && (
              <QuickActions
                onUploadFiles={triggerFileUpload}
                onCreateFolder={() => setCreateFolderModal(true)}
                onConnectDrive={() => dispatch(setConnectModalOpen(true))}
                onTransferFiles={() => setTransferModal({ open: true, file: files[0] || null })}
                onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                onNavigateView={(view) => dispatch(setActiveNav(view))}
              />
            )}

            {/* 3. Real-time Storage & Content Analytics Module */}
            {activeNav === 'home' && !currentFolder && (
              <DashboardAnalytics
                files={files}
                connectedAccounts={connectedAccounts}
              />
            )}

            {/* 4. Compact Multi-Drive Storage Overview (shown on Home view when at root) */}
            {activeNav === 'home' && !currentFolder && (
              <StorageOverview
                connectedAccounts={connectedAccounts}
                onConnectDrive={() => dispatch(setConnectModalOpen(true))}
                onSelectAccount={(email) => dispatch(setSelectedAccount(email))}
              />
            )}

            {/* 5. Short & Compact Recent Activity (Top 3 files) */}
            {activeNav === 'home' && !currentFolder && (
              <RecentFiles
                files={files}
                onFileClick={handleFileClick}
                onFileDetails={(f) => setSelectedInspectorFile(f)}
                onDownload={handleDownload}
                onShare={(f) => {
                  const link = `${window.location.origin}/dashboard?share=${f.id}`;
                  navigator.clipboard.writeText(link);
                  toast.success('Share link copied');
                }}
                onRename={handleRename}
                onDelete={handleDelete}
                onContextMenu={handleContextMenu}
                onViewAllRecent={() => dispatch(setActiveNav('recent'))}
              />
            )}

            {/* 5. File Browser Section */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 400,
                background: 'var(--color-bg-surface)',
              }}
            >
              {/* File Toolbar */}
              <FileToolbar
                currentFolder={currentFolder}
                onNavigateRoot={navigateToRoot}
                searchQuery={inViewSearch}
                onSearchChange={setInViewSearch}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={toggleSort}
                viewMode={viewMode}
                onViewModeChange={(mode) => dispatch(setViewMode(mode))}
                selectedCount={selectedFiles.length}
                totalCount={processedFiles.length}
                onSelectAll={() => dispatch(selectAll(processedFiles.map((f) => f.id)))}
                onClearSelection={() => dispatch(clearSelection())}
                onBatchDelete={() => setBatchDeleteConfirm(true)}
                onCreateFolder={() => setCreateFolderModal(true)}
              />

              {/* File View (Grid or List) */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                {viewMode === VIEW_MODES.GRID ? (
                  <FileGrid
                    files={processedFiles}
                    onFileClick={handleFileClick}
                    onContextMenu={handleContextMenu}
                    onMenuClick={(e, file) => handleContextMenu(e, file)}
                  />
                ) : (
                  <FileList
                    files={processedFiles}
                    onFileClick={handleFileClick}
                    onContextMenu={handleContextMenu}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onFileDetails={(f) => setSelectedInspectorFile(f)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 6. Right-Side File Details Panel (Inspector) */}
          {selectedInspectorFile && (
            <FileDetailsPanel
              file={selectedInspectorFile}
              onClose={() => setSelectedInspectorFile(null)}
              onDownload={handleDownload}
              onRename={handleRename}
              onDelete={handleDelete}
              onToggleStar={toggleStar}
            />
          )}
        </div>

        {/* ── Modals & Overlays ── */}
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          files={files}
          connectedAccounts={connectedAccounts}
          onSelectFile={(f) => {
            if (isFolder(f)) navigateToFolder(f, f.accountEmail);
            else setPreviewFile(f);
          }}
          onUploadFiles={triggerFileUpload}
          onCreateFolder={() => setCreateFolderModal(true)}
          onConnectDrive={() => dispatch(setConnectModalOpen(true))}
          onSetViewMode={(m) => dispatch(setViewMode(m))}
        />

        <CreateFolderModal
          open={createFolderModal}
          onOpenChange={setCreateFolderModal}
          currentFolder={currentFolder}
          connectedAccounts={connectedAccounts}
          onFolderCreated={() => fetchFilesForAllAccounts()}
        />

        <FileContextMenu
          file={contextMenu.file}
          position={contextMenu.open ? { x: contextMenu.x, y: contextMenu.y } : null}
          open={contextMenu.open}
          onClose={closeContextMenu}
          onPreview={(f) => setPreviewFile(f)}
          onDetails={(f) => setSelectedInspectorFile(f)}
          onRename={handleRename}
          onDelete={handleDelete}
          onRestore={restoreFileAction}
          onPermanentDelete={handlePermanentDelete}
          onToggleStar={toggleStar}
          onCopyToDrive={handleCopyToDrive}
          connectedAccounts={connectedAccounts}
          onDownload={handleDownload}
        />

        <RenameModal
          open={renameModal.open}
          onOpenChange={(o) => setRenameModal((prev) => ({ ...prev, open: o }))}
          file={renameModal.file}
          onRename={renameFileAction}
        />

        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(o) => setDeleteConfirm((prev) => ({ ...prev, open: o }))}
          title={deleteConfirm.permanent ? 'Permanently delete?' : 'Move to trash?'}
          description={
            deleteConfirm.permanent
              ? `"${deleteConfirm.file?.name}" will be permanently deleted and cannot be recovered.`
              : `"${deleteConfirm.file?.name}" will be moved to Google Drive trash.`
          }
          confirmLabel={deleteConfirm.permanent ? 'Delete Forever' : 'Move to Trash'}
          confirmVariant="danger"
          onConfirm={confirmDelete}
        />

        <ConfirmDialog
          open={batchDeleteConfirm}
          onOpenChange={setBatchDeleteConfirm}
          title={`Move ${selectedFiles.length} files to trash?`}
          description="The selected files will be moved to Google Drive trash."
          confirmLabel="Move to Trash"
          confirmVariant="danger"
          onConfirm={confirmBatchDelete}
        />

        {previewFile && (
          <FilePreviewModal
            file={previewFile}
            files={processedFiles.filter((f) => !isFolder(f))}
            onClose={() => setPreviewFile(null)}
            onNavigate={setPreviewFile}
          />
        )}

        <TransferModal
          open={transferModal.open}
          onOpenChange={(o) => setTransferModal((prev) => ({ ...prev, open: o }))}
          file={transferModal.file}
        />
      </div>
    </UploadZone>
  );
};

export default Dashboard;
