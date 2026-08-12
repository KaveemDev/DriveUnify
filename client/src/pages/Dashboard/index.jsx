import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { getFile } from '../../api/googleDriveApi';
import {
  Cloud, Plus, RefreshCw, SortAsc, SortDesc,
  Upload,
  LayoutGrid, List
} from 'lucide-react';
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
import { setSortBy, setSortDir, setViewMode } from '../../store/slices/driveSlice';
import { useDrive } from '../../hooks/useDrive';
import { useSearch } from '../../hooks/useSearch';
import { VIEW_MODES, SORT_OPTIONS } from '../../config/constants';
import { isFolder } from '../../utils/helpers';
import { formatFileSize, formatRelativeDate } from '../../utils/formatters';
import { FileIcon } from '../../components/explorer/FileIcon';
import { motion } from 'framer-motion';

/* ── Skeleton ── */
const SkeletonRow = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', borderBottom: '1px solid var(--color-border)',
  }}>
    <div className="skeleton" style={{ width: 15, height: 15, borderRadius: 4 }} />
    <div className="skeleton" style={{ width: 18, height: 18, borderRadius: 4 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="skeleton" style={{ width: '45%', height: 12, borderRadius: 4 }} />
      <div className="skeleton" style={{ width: '25%', height: 10, borderRadius: 4 }} />
    </div>
    <div className="skeleton" style={{ width: 120, height: 12, borderRadius: 4 }} />
    <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4 }} />
  </div>
);

const SkeletonTable = () => (
  <div>
    {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
  </div>
);

/* ── Quick Action Card ── */
const QuickActionCard = ({ icon: Icon, label, onClick }) => (
  <motion.div
    whileHover={{ y: -1 }}
    transition={{ duration: 0.15 }}
  >
    <div className="qa-card" onClick={onClick}>
      <div className="qa-card-icon">
        <Icon size={18} />
      </div>
      <span className="qa-card-label">{label}</span>
      <button className="qa-card-add" onClick={e => { e.stopPropagation(); onClick?.(); }}>
        <Plus size={11} />
      </button>
    </div>
  </motion.div>
);

/* ── Recently Modified Card ── */
const RecentlyModifiedCard = ({ file, onClick, onMenuClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="recmod-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick?.(file)}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      {/* Icon */}
      <div style={{
        width: 30, height: 30, borderRadius: 6,
        background: 'var(--color-bg-overlay)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <FileIcon category={file.category} size={17} />
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.8rem', fontWeight: 500,
          color: 'var(--color-text-primary)', lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {file.name}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: 1, display: 'flex', gap: 4 }}>
          {!isFolder(file) && <span>{formatFileSize(file.size)}</span>}
          {!isFolder(file) && <span>·</span>}
          <span>{file.category?.toLowerCase() || 'file'}</span>
        </div>
      </div>
    </div>
  );
};

/* ── Sort Menu ── */
const SortButton = ({ sortBy, sortDir, onToggle }) => {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find(o => o.value === sortBy);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 7,
          border: '1px solid var(--color-border)',
          background: 'transparent', cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          fontSize: '0.8rem', fontWeight: 500,
          transition: 'background 130ms',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {sortDir === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />}
        <span className="hidden sm:inline">{current?.label || 'Sort'}</span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 10px 38px -10px rgba(0,0,0,0.2), 0 2px 8px -4px rgba(0,0,0,0.1)',
            minWidth: 160,
          }}>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onToggle(opt.value); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '8px 14px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: '0.8rem',
                  color: sortBy === opt.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontWeight: sortBy === opt.value ? 600 : 400,
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {opt.label}
                {sortBy === opt.value && (sortDir === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


/* ── Dashboard ── */
const Dashboard = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { connectedAccounts, loading, viewMode, sortBy, sortDir } = useSelector(s => s.drive);

  const { filteredFiles, totalCount, filteredCount } = useSearch();
  const {
    fetchFilesForAllAccounts, navigateToFolder, navigateToRoot,
    renameFileAction, deleteFileAction, permanentlyDeleteFileAction, toggleStar,
  } = useDrive();

  const [contextMenu,   setContextMenu]   = useState({ open: false, file: null, x: 0, y: 0 });
  const [renameModal,   setRenameModal]   = useState({ open: false, file: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, file: null, permanent: false });
  const [previewFile,   setPreviewFile]   = useState(null);
  const [transferModal, setTransferModal] = useState({ open: false, file: null });

  useEffect(() => {
    if (connectedAccounts.length > 0) fetchFilesForAllAccounts();
  }, [connectedAccounts.length]);

  useEffect(() => {
    const shareId = searchParams.get('share');
    if (shareId && connectedAccounts.length > 0) {
      const fetchSharedFile = async () => {
        let foundFile = null;
        for (const account of connectedAccounts) {
          try {
            const file = await getFile(account.accessToken, shareId, account.email);
            if (file) { foundFile = file; foundFile.accountEmail = account.email; break; }
          } catch {}
        }
        if (foundFile) setPreviewFile(foundFile);
        else toast.error('You do not have access to this shared file');
        searchParams.delete('share');
        setSearchParams(searchParams);
      };
      fetchSharedFile();
    }
  }, [searchParams, connectedAccounts, setSearchParams]);

  const handleFileClick = useCallback((file) => {
    if (isFolder(file)) navigateToFolder(file, file.accountEmail);
    else setPreviewFile(file);
  }, [navigateToFolder]);

  const handleContextMenu = useCallback((e, file) => {
    setContextMenu({ open: true, file, x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, open: false }));
  }, []);

  const handleDelete          = (file) => setDeleteConfirm({ open: true, file, permanent: false });
  const handlePermanentDelete = (file) => setDeleteConfirm({ open: true, file, permanent: true });
  const handleRename          = (file) => setRenameModal({ open: true, file });
  const handleCopyToDrive     = useCallback((file) => setTransferModal({ open: true, file }), []);

  const confirmDelete = async () => {
    const { file, permanent } = deleteConfirm;
    setDeleteConfirm({ open: false, file: null, permanent: false });
    if (permanent) await permanentlyDeleteFileAction(file);
    else           await deleteFileAction(file);
  };

  const toggleSort = (field) => {
    if (sortBy === field) dispatch(setSortDir(sortDir === 'asc' ? 'desc' : 'asc'));
    else { dispatch(setSortBy(field)); dispatch(setSortDir('asc')); }
  };

  /* Recently modified — top 3 non-folder files sorted by modifiedTime */
  const recentlyModified = [...filteredFiles]
    .filter(f => !isFolder(f))
    .sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime))
    .slice(0, 3);

  /* ── Empty state: no accounts ── */
  if (!loading && connectedAccounts.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
      </div>
    );
  }

  return (
    <UploadZone>
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: 'var(--color-bg-base)',
      }}>

        {/* ─────────── Header row: title + breadcrumb ─────────── */}
        <div style={{
          padding: '16px 16px 0',
          display: 'flex', alignItems: 'flex-start', gap: 12,
          flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: '1.25rem', fontWeight: 700,
              color: 'var(--color-text-primary)', letterSpacing: '-0.02em',
            }}>
              Project files
            </h1>
            <FileBreadcrumb onNavigateRoot={navigateToRoot} />
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={fetchFilesForAllAccounts}
            title="Refresh"
            style={{
              width: 30, height: 30, borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 130ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>


        {/* ─────────── Recently Modified ─────────── */}
        {window.innerWidth > 500 && recentlyModified.length > 0 && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
            }}>
              <h2 style={{
                margin: 0, fontSize: '0.875rem', fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}>
                Recently modified
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                 className="sm:flex-row">
              {recentlyModified.map(file => (
                <RecentlyModifiedCard
                  key={file.id + file.accountEmail}
                  file={file}
                  onClick={handleFileClick}
                  onMenuClick={(e, f) => handleContextMenu(e, f)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─────────── All Files ─────────── */}
        <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h2 style={{
            margin: 0, fontSize: '0.9rem', fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}>
            All files
          </h2>
          <div style={{ flex: 1 }} />

          {/* File count */}
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {filteredCount !== totalCount ? `${filteredCount} of ${totalCount}` : totalCount} files
          </span>

          {/* Sort */}
          <SortButton sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} />

          {/* View toggle */}
          <div style={{
            display: 'flex', background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)', borderRadius: 7, padding: 2, gap: 2,
          }}>
            <button
              onClick={() => dispatch(setViewMode(VIEW_MODES.LIST))}
              title="List view"
              style={{
                width: 26, height: 26, borderRadius: 5, border: 'none', cursor: 'pointer',
                background: viewMode === VIEW_MODES.LIST ? 'var(--color-bg-surface)' : 'transparent',
                color: viewMode === VIEW_MODES.LIST ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: viewMode === VIEW_MODES.LIST ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 130ms',
              }}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => dispatch(setViewMode(VIEW_MODES.GRID))}
              title="Grid view"
              style={{
                width: 26, height: 26, borderRadius: 5, border: 'none', cursor: 'pointer',
                background: viewMode === VIEW_MODES.GRID ? 'var(--color-bg-surface)' : 'transparent',
                color: viewMode === VIEW_MODES.GRID ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: viewMode === VIEW_MODES.GRID ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 130ms',
              }}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        {/* ─────────── File content area ─────────── */}
        <div style={{ flex: 1, minHeight: 0, margin: '10px 16px 16px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 10, overflow: 'hidden',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
          }}>
            {loading && filteredFiles.length === 0 ? (
              <SkeletonTable />
            ) : filteredFiles.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '64px 24px', gap: 8,
              }}>
                <Cloud size={36} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  No files found
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Try a different search or connect another Google Drive.
                </div>
              </div>
            ) : viewMode === VIEW_MODES.GRID ? (
              <FileGrid
                files={filteredFiles}
                onFileClick={handleFileClick}
                onContextMenu={handleContextMenu}
                onMenuClick={(e, file) => handleContextMenu(e, file)}
              />
            ) : (
              <FileList
                files={filteredFiles}
                onFileClick={handleFileClick}
                onContextMenu={handleContextMenu}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>

        {/* ─────────── Modals / overlays ─────────── */}
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

        <RenameModal
          open={renameModal.open}
          onOpenChange={(o) => setRenameModal(prev => ({ ...prev, open: o }))}
          file={renameModal.file}
          onRename={renameFileAction}
        />

        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(o) => setDeleteConfirm(prev => ({ ...prev, open: o }))}
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

        {previewFile && (
          <FilePreviewModal
            file={previewFile}
            files={filteredFiles.filter(f => !isFolder(f))}
            onClose={() => setPreviewFile(null)}
            onNavigate={setPreviewFile}
          />
        )}

        <TransferModal
          open={transferModal.open}
          onOpenChange={(o) => setTransferModal(prev => ({ ...prev, open: o }))}
          file={transferModal.file}
        />
      </div>
    </UploadZone>
  );
};

export default Dashboard;
