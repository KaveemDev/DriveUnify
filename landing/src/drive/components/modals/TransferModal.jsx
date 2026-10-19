import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Typography, Avatar, Alert, LinearProgress,
  FormControl, InputLabel, Select, MenuItem, Chip,
  Divider, IconButton, Skeleton, Tooltip,
} from '@mui/material';
import {
  ArrowRight, ArrowDown, CheckCircle2, XCircle, Loader2,
  FileText, Image, FileVideo, FileAudio, Archive, File,
  Cloud, Folder, FolderOpen, ChevronRight, ChevronLeft,
  Home, CopyPlus, Sparkles, Plus,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { transferFile, transferFolder, countFilesInFolder } from '../../services/google-drive/transfer';
import { listFoldersInFolder } from '../../api/googleDriveApi';
import { listDropboxFolders } from '../../api/dropboxApi';
import { CloudProviderIcon, ProviderBadge } from '../common/ProviderBadge';
import { setConnectModalOpen } from '../../store/slices/uiSlice';
import { getAccountColor } from '../../config/constants';
import { getInitials, formatFileSize } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { Zap, ShieldCheck, HardDrive, ArrowUpRight } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────

const FOLDER_MIME = 'application/vnd.google-apps.folder';

const isFolderFile = (file) => file?.mimeType === FOLDER_MIME;

const getFileVisuals = (mimeType, name = '') => {
  const ext = name.split('.').pop()?.toUpperCase() || '';

  if (mimeType === FOLDER_MIME) {
    return {
      shadow: '0 8px 20px -3px rgba(245, 158, 11, 0.4)',
      accent: '#f59e0b',
      label: 'Folder',
      tag: 'DIRECTORY',
    };
  }
  if (mimeType?.startsWith('image/')) {
    return {
      shadow: '0 8px 20px -3px rgba(236, 72, 153, 0.4)',
      accent: '#ec4899',
      label: 'Image File',
      tag: ext || 'IMAGE',
    };
  }
  if (mimeType?.startsWith('video/')) {
    return {
      shadow: '0 8px 20px -3px rgba(139, 92, 246, 0.4)',
      accent: '#8b5cf6',
      label: 'Video Media',
      tag: ext || 'VIDEO',
    };
  }
  if (mimeType?.startsWith('audio/')) {
    return {
      shadow: '0 8px 20px -3px rgba(6, 182, 212, 0.4)',
      accent: '#06b6d4',
      label: 'Audio Track',
      tag: ext || 'AUDIO',
    };
  }
  if (mimeType?.includes('pdf')) {
    return {
      shadow: '0 8px 20px -3px rgba(239, 68, 68, 0.4)',
      accent: '#ef4444',
      label: 'PDF Document',
      tag: 'PDF',
    };
  }
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || ext === 'CSV' || ext === 'XLSX') {
    return {
      shadow: '0 8px 20px -3px rgba(16, 185, 129, 0.4)',
      accent: '#10b981',
      label: 'Spreadsheet',
      tag: ext || 'SHEET',
    };
  }
  if (mimeType?.includes('document') || mimeType?.includes('word') || ext === 'DOCX') {
    return {
      shadow: '0 8px 20px -3px rgba(59, 130, 246, 0.4)',
      accent: '#3b82f6',
      label: 'Document',
      tag: ext || 'DOC',
    };
  }
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
    return {
      shadow: '0 8px 20px -3px rgba(249, 115, 22, 0.4)',
      accent: '#f97316',
      label: 'Presentation',
      tag: ext || 'SLIDES',
    };
  }
  if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('tar') || mimeType?.includes('compressed')) {
    return {
      shadow: '0 8px 20px -3px rgba(99, 102, 241, 0.4)',
      accent: '#6366f1',
      label: 'Archive Package',
      tag: ext || 'ZIP',
    };
  }
  return {
    shadow: '0 8px 20px -3px rgba(59, 130, 246, 0.4)',
    accent: '#3b82f6',
    label: 'Cloud File',
    tag: ext || 'FILE',
  };
};

const FileTypeIcon = ({ mimeType, size = 22 }) => {
  if (!mimeType) return <File size={size} />;
  if (mimeType === FOLDER_MIME) return <Folder size={size} />;
  if (mimeType.startsWith('image/')) return <Image size={size} />;
  if (mimeType.startsWith('video/')) return <FileVideo size={size} />;
  if (mimeType.startsWith('audio/')) return <FileAudio size={size} />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar'))
    return <Archive size={size} />;
  return <FileText size={size} />;
};

const isGoogleAppsType = (mimeType) =>
  mimeType?.startsWith('application/vnd.google-apps.') &&
  mimeType !== FOLDER_MIME;

const AccountChip = ({ account }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
    <Avatar
      src={account.picture}
      sx={{ width: 22, height: 22, bgcolor: getAccountColor(account.email), fontSize: 10, flexShrink: 0 }}
    >
      {!account.picture && getInitials(account.email)}
    </Avatar>
    <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Typography variant="body2" noWrap sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
        {account.name || account.email}
      </Typography>
      <CloudProviderIcon provider={account.provider} size={13} />
    </Box>
  </Box>
);

// ── Folder Picker Sub-Component ───────────────────────────────

const FolderPicker = ({ destAccount, selectedFolder, onSelect }) => {
  const [path, setPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isDestDropbox = (destAccount?.provider || '').toLowerCase().includes('dropbox');
  const currentId = path.length > 0 ? path[path.length - 1].id : (isDestDropbox ? '' : 'root');

  useEffect(() => {
    if (!destAccount?.accessToken) return;
    setLoading(true);
    setError(null);

    if (isDestDropbox) {
      listDropboxFolders(destAccount.accessToken, currentId)
        .then((res) => setFolders(res || []))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      listFoldersInFolder(destAccount.accessToken, currentId, destAccount.email)
        .then((res) => setFolders(res?.files || []))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [currentId, destAccount?.accessToken, destAccount?.email, isDestDropbox]);

  useEffect(() => {
    setPath([]);
    setFolders([]);
  }, [destAccount?.email]);

  const navigateInto = (folder) => {
    setPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateBack = () => {
    setPath((prev) => prev.slice(0, -1));
  };

  const navigateToRoot = () => setPath([]);

  const currentDisplayName = path.length === 0
    ? (isDestDropbox ? 'Dropbox (All Files)' : 'My Drive')
    : path[path.length - 1].name;

  const isSelected = selectedFolder.id === currentId;

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2.5,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: '0 4px 20px -4px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header / Breadcrumb navigation */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Tooltip title="Go back">
          <span>
            <IconButton
              size="small"
              onClick={navigateBack}
              disabled={path.length === 0}
              sx={{ p: 0.75, borderRadius: 1.5 }}
            >
              <ChevronLeft size={16} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="My Drive root">
          <span>
            <IconButton
              size="small"
              onClick={navigateToRoot}
              disabled={path.length === 0}
              sx={{ p: 0.75, borderRadius: 1.5 }}
            >
              <Home size={15} />
            </IconButton>
          </span>
        </Tooltip>

        {/* Breadcrumb Trail */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flex: 1,
            minWidth: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            py: 0.25,
          }}
        >
          <Typography
            variant="caption"
            onClick={navigateToRoot}
            sx={{
              cursor: path.length > 0 ? 'pointer' : 'default',
              color: path.length === 0 ? 'text.primary' : 'text.secondary',
              fontWeight: path.length === 0 ? 600 : 400,
              flexShrink: 0,
              fontSize: '0.75rem',
              '&:hover': { textDecoration: path.length > 0 ? 'underline' : 'none' },
            }}
          >
            My Drive
          </Typography>

          {path.map((seg, i) => (
            <Box key={seg.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <ChevronRight size={12} style={{ opacity: 0.5 }} />
              <Typography
                variant="caption"
                onClick={() => i < path.length - 1 && setPath(path.slice(0, i + 1))}
                sx={{
                  cursor: i < path.length - 1 ? 'pointer' : 'default',
                  color: i === path.length - 1 ? 'text.primary' : 'text.secondary',
                  fontWeight: i === path.length - 1 ? 600 : 400,
                  maxWidth: { xs: 110, sm: 160 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.75rem',
                  '&:hover': { textDecoration: i < path.length - 1 ? 'underline' : 'none' },
                }}
              >
                {seg.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Subfolder list */}
      <Box sx={{ maxHeight: { xs: 180, sm: 200 }, overflowY: 'auto', p: 0.75 }}>
        {loading ? (
          <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={36} sx={{ borderRadius: 1.5 }} />
            ))}
          </Box>
        ) : error ? (
          <Typography variant="caption" color="error" sx={{ p: 2, display: 'block', textAlign: 'center' }}>
            {error}
          </Typography>
        ) : folders.length === 0 ? (
          <Box sx={{ py: 3, px: 2, textAlign: 'center' }}>
            <FolderOpen size={24} style={{ opacity: 0.4, margin: '0 auto 6px auto' }} />
            <Typography variant="caption" color="text.secondary" display="block">
              No subfolders in this location
            </Typography>
          </Box>
        ) : (
          folders.map((folder) => (
            <Box
              key={folder.id}
              onClick={() => navigateInto(folder)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'action.hover' },
                '&:active': { bgcolor: 'action.selected' },
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  bgcolor: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Folder size={16} />
              </Box>
              <Typography variant="body2" noWrap sx={{ flex: 1, fontSize: '0.8125rem' }}>
                {folder.name}
              </Typography>
              <ChevronRight size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
            </Box>
          ))
        )}
      </Box>

      {/* Footer: current target selection */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1.2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
          <FolderOpen size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.primary"
            noWrap
            sx={{ fontSize: '0.78rem' }}
          >
            {currentDisplayName}
          </Typography>
        </Box>
        <Button
          variant={isSelected ? 'primary' : 'outline'}
          size="xs"
          onClick={() => onSelect({ id: currentId, name: currentDisplayName })}
          className="flex-shrink-0"
        >
          {isSelected ? '✓ Selected' : 'Copy here'}
        </Button>
      </Box>
    </Box>
  );
};

// ── Transfer States ───────────────────────────────────────────

const STATE = {
  IDLE: 'idle',
  COUNTING: 'counting',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
};

// ── Main Component ─────────────────────────────────────────────

export const TransferModal = ({ open, onOpenChange, file }) => {
  const dispatch = useDispatch();
  const { connectedAccounts, files } = useSelector((s) => s.drive);

  const [selectedFileId, setSelectedFileId] = useState(file?.id || '');
  const [destEmail, setDestEmail] = useState('');
  const [destFolder, setDestFolder] = useState({ id: 'root', name: 'My Drive' });
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [state, setState] = useState(STATE.IDLE);
  const [errorMsg, setErrorMsg] = useState('');

  const [fileProgress, setFileProgress] = useState(0);
  const [folderProgress, setFolderProgress] = useState({ filesDone: 0, total: 0, currentFile: '' });
  const [activeMode, setActiveMode] = useState(null); // 'cloud_copy' | 'stream' | null
  const abortControllerRef = useRef(null);

  // Synchronize selected file
  useEffect(() => {
    if (file?.id) {
      setSelectedFileId(file.id);
    } else if (!selectedFileId && files?.length > 0) {
      setSelectedFileId(files[0].id);
    }
  }, [file, files, selectedFileId]);

  const activeFile = file || files.find((f) => f.id === selectedFileId) || (files?.length > 0 ? files[0] : null);
  const isFolder = isFolderFile(activeFile);
  const isGApps = !isFolder && isGoogleAppsType(activeFile?.mimeType);

  // Guarantee valid source account from activeFile or first connected account
  const srcAccount = activeFile
    ? (connectedAccounts.find((a) => a.email === activeFile.accountEmail) || connectedAccounts[0] || null)
    : (connectedAccounts[0] || null);

  const otherAccounts = srcAccount
    ? connectedAccounts.filter((a) => a.email !== srcAccount.email)
    : [];

  const destAccount = connectedAccounts.find((a) => a.email === destEmail) || otherAccounts[0] || null;

  // Auto-select first other account when destination is unassigned
  useEffect(() => {
    if (otherAccounts.length > 0 && (!destEmail || !otherAccounts.some((a) => a.email === destEmail))) {
      setDestEmail(otherAccounts[0].email);
    }
  }, [otherAccounts, destEmail]);

  // Reset picker when dest account changes
  useEffect(() => {
    const isDbx = (destAccount?.provider || '').toLowerCase().includes('dropbox');
    setDestFolder({
      id: isDbx ? '' : 'root',
      name: isDbx ? 'Dropbox (All Files)' : 'My Drive',
    });
    setShowFolderPicker(false);
  }, [destEmail, destAccount?.provider]);

  // Clean up controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    if (state === STATE.RUNNING || state === STATE.COUNTING) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      toast('Transfer cancelled', { icon: '🛑' });
      setState(STATE.IDLE);
      return;
    }
    setState(STATE.IDLE);
    setDestEmail('');
    setDestFolder({ id: 'root', name: 'My Drive' });
    setShowFolderPicker(false);
    setFileProgress(0);
    setActiveMode(null);
    setFolderProgress({ filesDone: 0, total: 0, currentFile: '' });
    setErrorMsg('');
    onOpenChange(false);
  }, [state, onOpenChange]);

  const handleTransfer = useCallback(async () => {
    if (!srcAccount || !destAccount || !activeFile) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState(STATE.RUNNING);
    setErrorMsg('');
    setFileProgress(0);
    setActiveMode('cloud_copy');

    try {
      if (isFolder) {
        // Pre-count files for deterministic progress
        setState(STATE.COUNTING);
        let total = 0;
        try {
          total = await countFilesInFolder(srcAccount, activeFile.id);
        } catch {
          total = 0;
        }
        if (controller.signal.aborted) return;

        setFolderProgress({ filesDone: 0, total, currentFile: '' });
        setState(STATE.RUNNING);

        await transferFolder(
          srcAccount,
          destAccount,
          activeFile,
          destFolder.id,
          ({ filesDone, currentFile }) => {
            setFolderProgress({ filesDone, total, currentFile });
          },
          { done: 0, total },
          controller.signal
        );

        toast.success(`Folder "${activeFile.name}" copied to ${destAccount.email}`, { icon: '📁' });
      } else {
        const result = await transferFile(
          srcAccount,
          destAccount,
          activeFile,
          destFolder.id,
          (pct, meta) => {
            setFileProgress(pct);
            if (meta?.mode) setActiveMode(meta.mode);
          },
          controller.signal
        );

        setActiveMode(result?.transferMode || 'cloud_copy');
        toast.success(`"${activeFile.name}" copied to ${destAccount.email}`, { icon: '✅' });
      }
      setState(STATE.SUCCESS);
    } catch (err) {
      if (controller.signal.aborted || err.name === 'AbortError') {
        setState(STATE.IDLE);
        toast('Transfer cancelled', { icon: '🛑' });
        return;
      }
      setState(STATE.ERROR);
      setErrorMsg(err.message || 'Transfer failed. Please try again.');
    } finally {
      abortControllerRef.current = null;
    }
  }, [srcAccount, destAccount, activeFile, destFolder.id, isFolder]);

  const canTransfer = destEmail && state === STATE.IDLE && activeFile;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={isFolder ? 'Transfer Folder' : 'Transfer File'}
      description={
        connectedAccounts.length < 2
          ? 'Connect another Google Drive or Dropbox account to enable instant cross-account transfers.'
          : isFolder
          ? 'Recursively clone this folder and all its contents to another connected cloud storage account.'
          : 'Instantly transfer this file to another connected cloud storage account.'
      }
      size="md"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>

        {/* ── Case 1: Less than 2 Connected Accounts (Onboarding State) ── */}
        {connectedAccounts.length < 2 ? (
          <Box
            sx={{
              py: 3,
              px: { xs: 1, sm: 2 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 2.5,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px -4px rgba(59, 130, 246, 0.25)',
              }}
            >
              <Cloud size={32} />
            </Box>

            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem', color: 'text.primary', mb: 0.75 }}>
                Connect a Second Account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 430, fontSize: '0.84rem', lineHeight: 1.55 }}>
                Cross-cloud copying transfers files directly between multiple Google Drive and Dropbox accounts. Connect at least two accounts in DriveUnify to enable one-click cloud migration.
              </Typography>
            </Box>

            {/* Symmetrical Connection Preview */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr' },
                alignItems: 'center',
                gap: 1.5,
                width: '100%',
                maxWidth: 480,
              }}
            >
              {connectedAccounts.length === 1 ? (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2.25,
                    bgcolor: 'action.hover',
                    border: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    textAlign: 'left',
                  }}
                >
                  <Avatar
                    src={connectedAccounts[0].picture}
                    sx={{ width: 34, height: 34, bgcolor: getAccountColor(connectedAccounts[0].email), fontSize: 12, flexShrink: 0 }}
                  >
                    {!connectedAccounts[0].picture && getInitials(connectedAccounts[0].email)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                      {connectedAccounts[0].name || connectedAccounts[0].email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.68rem', mt: 0.2 }}>
                      {connectedAccounts[0].email}
                    </Typography>
                    <Chip label="✓ Connected" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.58rem', mt: 0.5 }} />
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.25,
                    bgcolor: 'action.hover',
                    border: '1px dashed',
                    borderColor: 'divider',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">No Drive Connected</Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', color: 'text.secondary' }}>
                <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
                  <ArrowRight size={18} />
                </Box>
                <Box sx={{ display: { xs: 'flex', sm: 'none' } }}>
                  <ArrowDown size={18} />
                </Box>
              </Box>

              <Box
                onClick={() => {
                  handleClose();
                  dispatch(setConnectModalOpen(true));
                }}
                sx={{
                  p: 1.5,
                  borderRadius: 2.25,
                  border: '1.5px dashed',
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(59, 130, 246, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.08)',
                    borderColor: 'primary.dark',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    bgcolor: 'rgba(59, 130, 246, 0.12)',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={18} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', color: 'primary.main' }}>
                    Add Target Drive
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem' }}>
                    Click to connect
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.25, mt: 1, width: '100%', maxWidth: 420 }}>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleClose();
                  dispatch(setConnectModalOpen(true));
                }}
                className="flex-1"
                icon={Plus}
              >
                Connect Drive
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* ── Case 2: Multi-Account Mode (Normal Flow) ── */}

            {/* File Selector (shown if no file pre-selected and files exist) */}
            {!file && files?.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.68rem' }}>
                  Select File to Copy
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedFileId}
                    onChange={(e) => setSelectedFileId(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      fontSize: '0.82rem',
                      '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 1 },
                    }}
                  >
                    {files.map((f) => (
                      <MenuItem key={f.id} value={f.id} sx={{ py: 1, fontSize: '0.82rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', minWidth: 0 }}>
                          <FileTypeIcon mimeType={f.mimeType} size={16} />
                          <Typography variant="body2" noWrap sx={{ flex: 1, fontSize: '0.82rem' }}>
                            {f.name}
                          </Typography>
                          {f.size > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', flexShrink: 0 }}>
                              {formatFileSize(f.size)}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Item Info Card */}
            {activeFile ? (() => {
              const visuals = getFileVisuals(activeFile.mimeType, activeFile.name);
              return (
                <Box
                  sx={{
                    p: { xs: 1.75, sm: 2 },
                    borderRadius: 2.75,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px -6px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -24,
                      right: -24,
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      background: visuals.accent,
                      opacity: 0.12,
                      filter: 'blur(20px)',
                      pointerEvents: 'none',
                    }}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, position: 'relative' }}>
                    <Box
                      sx={{
                        width: { xs: 46, sm: 52 },
                        height: { xs: 46, sm: 52 },
                        borderRadius: 2.25,
                        background: visuals.accent,
                        boxShadow: visuals.shadow,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.04)' },
                      }}
                    >
                      <FileTypeIcon mimeType={activeFile.mimeType} size={24} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            color: 'text.primary',
                            fontSize: { xs: '0.88rem', sm: '0.94rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                          title={activeFile.name}
                        >
                          {activeFile.name}
                        </Typography>
                        <Chip
                          label={visuals.tag}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            color: visuals.accent,
                            flexShrink: 0,
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <span>{visuals.label}</span>
                          {!isFolder && activeFile.size > 0 && (
                            <>
                              <span>•</span>
                              <span style={{ fontWeight: 600 }}>{formatFileSize(activeFile.size)}</span>
                            </>
                          )}
                        </Typography>

                        <Chip
                          icon={isFolder ? <Folder size={11} /> : isGApps ? <Zap size={11} /> : <HardDrive size={11} />}
                          label={
                            isFolder
                              ? 'Recursive Sync'
                              : isGApps
                              ? 'Zero-Byte Native Copy'
                              : 'High-Speed Stream'
                          }
                          size="small"
                          variant="outlined"
                          color={isFolder ? 'warning' : isGApps ? 'success' : 'info'}
                          sx={{
                            height: 20,
                            fontSize: '0.66rem',
                            fontWeight: 500,
                            '& .MuiChip-icon': { ml: 0.5 },
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })() : (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={500}>
                  No file selected. Please select a file from your Drive to copy.
                </Typography>
              </Alert>
            )}

            {/* ── Source → Destination Accounts Flow ── */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr' },
                alignItems: 'stretch',
                gap: 1.25,
              }}
            >
              {/* Source Account Box */}
              <Box
                sx={{
                  p: 1.5,
                  minHeight: 72,
                  borderRadius: 2.25,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>
                    From (Source)
                  </Typography>
                  <Chip label="Source" size="small" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 600, bgcolor: 'background.paper', color: 'text.secondary' }} />
                </Box>

                {srcAccount ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, mt: 0.25 }}>
                    <Avatar
                      src={srcAccount.picture}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: getAccountColor(srcAccount.email),
                        fontSize: 11,
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                      }}
                    >
                      {!srcAccount.picture && getInitials(srcAccount.email)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.25 }}>
                        {srcAccount.name || srcAccount.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.68rem', mt: 0.2 }}>
                        {srcAccount.email}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">No account connected</Typography>
                )}
              </Box>

              {/* Directional Icon Badge */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                  py: { xs: 0.5, sm: 0 },
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.main',
                  }}
                >
                  <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    <ArrowRight size={16} />
                  </Box>
                  <Box sx={{ display: { xs: 'flex', sm: 'none' } }}>
                    <ArrowDown size={16} />
                  </Box>
                </Box>
              </Box>

              {/* Destination Account Selector Box */}
              <Box
                sx={{
                  p: 1.5,
                  minHeight: 72,
                  borderRadius: 2.25,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 0.5,
                  transition: 'border-color 0.15s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>
                    To (Destination)
                  </Typography>
                  <Chip label="Target" size="small" color="primary" variant="outlined" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 600 }} />
                </Box>

                <FormControl fullWidth size="small" variant="standard">
                  <Select
                    value={destEmail}
                    onChange={(e) => {
                      setDestEmail(e.target.value);
                      setState(STATE.IDLE);
                      setErrorMsg('');
                    }}
                    disabled={state !== STATE.IDLE || otherAccounts.length === 0}
                    disableUnderline
                    renderValue={(val) => {
                      const acc = otherAccounts.find((a) => a.email === val);
                      return acc ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, mt: 0.25 }}>
                          <Avatar
                            src={acc.picture}
                            sx={{ width: 32, height: 32, bgcolor: getAccountColor(acc.email), fontSize: 11, flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}
                          >
                            {!acc.picture && getInitials(acc.email)}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.82rem', lineHeight: 1.25 }}>
                              {acc.name || acc.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.68rem', mt: 0.2 }}>
                              {acc.email}
                            </Typography>
                          </Box>
                        </Box>
                      ) : null;
                    }}
                    sx={{
                      width: '100%',
                      '& .MuiSelect-select': {
                        p: 0,
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                      },
                    }}
                  >
                    {otherAccounts.map((acc) => (
                      <MenuItem key={acc.email} value={acc.email} sx={{ py: 1.25, px: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                          <Avatar
                            src={acc.picture}
                            sx={{ width: 30, height: 30, bgcolor: getAccountColor(acc.email), fontSize: 11, flexShrink: 0 }}
                          >
                            {!acc.picture && getInitials(acc.email)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.82rem' }}>
                              {acc.name || acc.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.7rem' }}>
                              {acc.email}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* ── Destination Folder Picker Card ── */}
            {destEmail && state === STATE.IDLE && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.25,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.66rem' }}>
                    Destination Folder
                  </Typography>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowFolderPicker((v) => !v)}
                  >
                    {showFolderPicker ? 'Close Browser' : 'Browse Folders'}
                  </Button>
                </Box>

                {/* Current target pill */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    p: 1.2,
                    borderRadius: 1.75,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: showFolderPicker ? 'primary.main' : 'divider',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <Folder size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1, fontSize: '0.8125rem' }} noWrap>
                    {destFolder.name}
                  </Typography>
                  {destFolder.id !== 'root' ? (
                    <Chip
                      label="Custom Subfolder"
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.63rem' }}
                    />
                  ) : (
                    <Chip
                      label="Root"
                      size="small"
                      sx={{ height: 18, fontSize: '0.63rem', bgcolor: 'action.hover', color: 'text.secondary' }}
                    />
                  )}
                </Box>

                {showFolderPicker && destAccount && (
                  <Box sx={{ mt: 1.5 }}>
                    <FolderPicker
                      destAccount={destAccount}
                      selectedFolder={destFolder}
                      onSelect={(folder) => {
                        setDestFolder(folder);
                        setShowFolderPicker(false);
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}

            {/* ── Scanning / Counting Phase ── */}
            {state === STATE.COUNTING && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.75,
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Loader2 size={22} className="animate-spin text-brand" style={{ flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Scanning folder hierarchy…</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Analyzing nested subfolders and files before migration begins.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ── Folder Progress ── */}
            {state === STATE.RUNNING && isFolder && (
              <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <CopyPlus size={18} className="text-brand" style={{ flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {folderProgress.total > 0
                        ? `${folderProgress.filesDone} of ${folderProgress.total} files copied`
                        : `${folderProgress.filesDone} files copied`}
                    </Typography>
                    {folderProgress.currentFile && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.72rem', mt: 0.25 }}>
                        {folderProgress.filesDone < folderProgress.total ? '↳ ' : '✓ '}{folderProgress.currentFile}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {folderProgress.total > 0 ? (
                  <LinearProgress
                    variant="determinate"
                    value={Math.round((folderProgress.filesDone / folderProgress.total) * 100)}
                    sx={{
                      borderRadius: 3,
                      height: 6,
                      bgcolor: 'action.selected',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        background: 'var(--color-accent)',
                      },
                    }}
                  />
                ) : (
                  <LinearProgress variant="indeterminate" sx={{ borderRadius: 3, height: 6 }} />
                )}
              </Box>
            )}

            {/* ── Single File Progress (Streaming Mode) ── */}
            {state === STATE.RUNNING && !isFolder && activeMode === 'stream' && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.75,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                  boxShadow: '0 4px 18px -4px rgba(59, 130, 246, 0.12)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        bgcolor: 'rgba(59, 130, 246, 0.12)',
                        color: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CopyPlus size={16} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>
                        Streaming file to destination…
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Bounded 8 MiB in-memory pipeline
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#3b82f6', fontSize: '0.9rem' }}>
                      {fileProgress}%
                    </Typography>
                    {activeFile?.size > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block' }}>
                        {formatFileSize(Math.round((activeFile.size * fileProgress) / 100))} / {formatFileSize(activeFile.size)}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={fileProgress}
                  sx={{
                    borderRadius: 3,
                    height: 7,
                    bgcolor: 'action.selected',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: 'var(--color-accent)',
                    },
                  }}
                />
              </Box>
            )}

            {/* ── Single File Progress (Cloud Copy Mode) ── */}
            {state === STATE.RUNNING && !isFolder && activeMode !== 'stream' && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.75,
                  p: 2,
                  borderRadius: 2.75,
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Zap size={20} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Zero-Latency Cloud Cloning…</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    Duplicating directly within Google Cloud servers. Zero bytes downloaded.
                  </Typography>
                </Box>
                <Loader2 size={20} className="animate-spin text-emerald-500" style={{ flexShrink: 0 }} />
              </Box>
            )}

            {/* ── Success Banner ── */}
            {state === STATE.SUCCESS && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.75,
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(16, 185, 129, 0.12)',
                  border: 1,
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  color: 'text.primary',
                }}
              >
                <CheckCircle2 size={24} style={{ color: '#10b981', flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#10b981' }}>
                    {isFolder ? 'Folder Copied Successfully!' : 'File Copied Successfully!'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    "{activeFile?.name}" is now accessible in {destAccount?.email}'s Drive
                    {destFolder.id !== 'root' ? ` (inside "${destFolder.name}")` : ''}.
                    {!isFolder && (
                      <span style={{ display: 'block', fontWeight: 600, marginTop: 2 }}>
                        {activeMode === 'stream' ? 'Transferred via 8 MiB Bounded Stream' : 'Transferred via Instant Cloud-to-Cloud Copy'}
                      </span>
                    )}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* ── Error Banner ── */}
            {state === STATE.ERROR && (
              <Alert severity="error" icon={<XCircle size={18} />} sx={{ borderRadius: 2 }}>
                <Typography variant="body2">{errorMsg}</Typography>
              </Alert>
            )}

            {/* ── Explanatory Hint ── */}
            {state === STATE.IDLE && destEmail && !showFolderPicker && (
              <Alert severity="info" sx={{ py: 0.75, px: 1.5, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ lineHeight: 1.4, display: 'block' }}>
                  {isFolder
                    ? 'Folder transfer will recreate the complete directory structure and copy all child files into the destination account.'
                    : 'Preferred method: Zero-byte cloud-to-cloud copy. Automatic fallback: Bounded 8 MiB in-memory resumable stream.'}
                </Typography>
              </Alert>
            )}

            <Divider sx={{ my: 0.5 }} />

            {/* ── Footer Actions (Only for Multi-Account Mode) ── */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column-reverse', sm: 'row' },
                gap: 1.25,
                justifyContent: 'flex-end',
                pt: 0.5,
              }}
            >
              {state === STATE.SUCCESS ? (
                <Button
                  variant="primary"
                  onClick={handleClose}
                  className="w-full sm:w-auto"
                >
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="w-full sm:w-auto"
                  >
                    {state === STATE.RUNNING || state === STATE.COUNTING ? 'Cancel Transfer' : 'Cancel'}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleTransfer}
                    disabled={!canTransfer || otherAccounts.length === 0}
                    loading={state === STATE.RUNNING || state === STATE.COUNTING}
                    icon={CopyPlus}
                    className="w-full sm:w-auto"
                  >
                    {state === STATE.COUNTING
                      ? 'Scanning…'
                      : state === STATE.RUNNING
                      ? 'Copying…'
                      : isFolder
                      ? 'Copy Folder'
                      : 'Copy to Drive'}
                  </Button>
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

