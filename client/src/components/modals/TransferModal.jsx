import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Avatar, Alert, LinearProgress,
  FormControl, InputLabel, Select, MenuItem, Chip,
  Divider, IconButton, Skeleton, Tooltip,
} from '@mui/material';
import {
  ArrowRight, ArrowDown, CheckCircle2, XCircle, Loader2,
  FileText, Image, FileVideo, FileAudio, Archive, File,
  Cloud, Folder, FolderOpen, ChevronRight, ChevronLeft,
  Home, CopyPlus, Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { transferFile, transferFolder, countFilesInFolder } from '../../services/google-drive/transfer';
import { listFoldersInFolder } from '../../api/googleDriveApi';
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
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadow: '0 8px 20px -3px rgba(245, 158, 11, 0.4)',
      accent: '#f59e0b',
      label: 'Folder',
      tag: 'DIRECTORY',
    };
  }
  if (mimeType?.startsWith('image/')) {
    return {
      gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      shadow: '0 8px 20px -3px rgba(236, 72, 153, 0.4)',
      accent: '#ec4899',
      label: 'Image File',
      tag: ext || 'IMAGE',
    };
  }
  if (mimeType?.startsWith('video/')) {
    return {
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      shadow: '0 8px 20px -3px rgba(139, 92, 246, 0.4)',
      accent: '#8b5cf6',
      label: 'Video Media',
      tag: ext || 'VIDEO',
    };
  }
  if (mimeType?.startsWith('audio/')) {
    return {
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
      shadow: '0 8px 20px -3px rgba(6, 182, 212, 0.4)',
      accent: '#06b6d4',
      label: 'Audio Track',
      tag: ext || 'AUDIO',
    };
  }
  if (mimeType?.includes('pdf')) {
    return {
      gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
      shadow: '0 8px 20px -3px rgba(239, 68, 68, 0.4)',
      accent: '#ef4444',
      label: 'PDF Document',
      tag: 'PDF',
    };
  }
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || ext === 'CSV' || ext === 'XLSX') {
    return {
      gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      shadow: '0 8px 20px -3px rgba(16, 185, 129, 0.4)',
      accent: '#10b981',
      label: 'Spreadsheet',
      tag: ext || 'SHEET',
    };
  }
  if (mimeType?.includes('document') || mimeType?.includes('word') || ext === 'DOCX') {
    return {
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      shadow: '0 8px 20px -3px rgba(59, 130, 246, 0.4)',
      accent: '#3b82f6',
      label: 'Document',
      tag: ext || 'DOC',
    };
  }
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
    return {
      gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
      shadow: '0 8px 20px -3px rgba(249, 115, 22, 0.4)',
      accent: '#f97316',
      label: 'Presentation',
      tag: ext || 'SLIDES',
    };
  }
  if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('tar') || mimeType?.includes('compressed')) {
    return {
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      shadow: '0 8px 20px -3px rgba(99, 102, 241, 0.4)',
      accent: '#6366f1',
      label: 'Archive Package',
      tag: ext || 'ZIP',
    };
  }
  return {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
    <Typography variant="body2" noWrap sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
      {account.name || account.email}
    </Typography>
  </Box>
);

// ── Folder Picker Sub-Component ───────────────────────────────

const FolderPicker = ({ destAccount, selectedFolder, onSelect }) => {
  const [path, setPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentId = path.length > 0 ? path[path.length - 1].id : 'root';

  useEffect(() => {
    if (!destAccount?.accessToken) return;
    setLoading(true);
    setError(null);
    listFoldersInFolder(destAccount.accessToken, currentId, destAccount.email)
      .then((res) => setFolders(res?.files || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentId, destAccount?.accessToken, destAccount?.email]);

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
    ? 'My Drive'
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
  const { connectedAccounts } = useSelector((s) => s.drive);

  const [destEmail, setDestEmail] = useState('');
  const [destFolder, setDestFolder] = useState({ id: 'root', name: 'My Drive' });
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [state, setState] = useState(STATE.IDLE);
  const [errorMsg, setErrorMsg] = useState('');

  const [fileProgress, setFileProgress] = useState(0);
  const [folderProgress, setFolderProgress] = useState({ filesDone: 0, total: 0, currentFile: '' });

  const isFolder = isFolderFile(file);
  const isGApps = !isFolder && isGoogleAppsType(file?.mimeType);

  const otherAccounts = file
    ? connectedAccounts.filter((a) => a.email !== file.accountEmail)
    : [];

  const srcAccount = file
    ? connectedAccounts.find((a) => a.email === file.accountEmail)
    : null;

  const destAccount = connectedAccounts.find((a) => a.email === destEmail) || null;

  // Reset picker when dest account changes
  useEffect(() => {
    setDestFolder({ id: 'root', name: 'My Drive' });
    setShowFolderPicker(false);
  }, [destEmail]);

  const handleClose = useCallback(() => {
    if (state === STATE.RUNNING || state === STATE.COUNTING) return;
    setState(STATE.IDLE);
    setDestEmail('');
    setDestFolder({ id: 'root', name: 'My Drive' });
    setShowFolderPicker(false);
    setFileProgress(0);
    setFolderProgress({ filesDone: 0, total: 0, currentFile: '' });
    setErrorMsg('');
    onOpenChange(false);
  }, [state, onOpenChange]);

  const handleTransfer = useCallback(async () => {
    if (!srcAccount || !destAccount || !file) return;

    setState(STATE.RUNNING);
    setErrorMsg('');
    setFileProgress(0);

    try {
      if (isFolder) {
        // Pre-count files for deterministic progress
        setState(STATE.COUNTING);
        let total = 0;
        try {
          total = await countFilesInFolder(srcAccount, file.id);
        } catch {
          total = 0;
        }
        setFolderProgress({ filesDone: 0, total, currentFile: '' });
        setState(STATE.RUNNING);

        await transferFolder(srcAccount, destAccount, file, destFolder.id, ({ filesDone, currentFile }) => {
          setFolderProgress({ filesDone, total, currentFile });
        });

        toast.success(`Folder "${file.name}" copied to ${destAccount.email}`, { icon: '📁' });
      } else {
        await transferFile(srcAccount, destAccount, file, destFolder.id, (pct) => setFileProgress(pct));
        toast.success(`"${file.name}" copied to ${destAccount.email}`, { icon: '✅' });
      }
      setState(STATE.SUCCESS);
    } catch (err) {
      setState(STATE.ERROR);
      setErrorMsg(err.message || 'Transfer failed. Please try again.');
    }
  }, [srcAccount, destAccount, file, destFolder.id, isFolder]);

  const canTransfer = destEmail && state === STATE.IDLE;

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={isFolder ? 'Copy Folder to Drive' : 'Copy File to Drive'}
      description={
        isFolder
          ? 'Recursively clone this folder and all its contents to another connected Google Drive account.'
          : 'Instantly transfer this file to another connected Google Drive account.'
      }
      size="md"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>

        {/* ── Item Info Card ── */}
        {file && (() => {
          const visuals = getFileVisuals(file.mimeType, file.name);
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
              {/* Subtle ambient corner glow */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -24,
                  right: -24,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: visuals.gradient,
                  opacity: 0.12,
                  filter: 'blur(20px)',
                  pointerEvents: 'none',
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, position: 'relative' }}>
                {/* Visual Icon Badge */}
                <Box
                  sx={{
                    width: { xs: 46, sm: 52 },
                    height: { xs: 46, sm: 52 },
                    borderRadius: 2.25,
                    background: visuals.gradient,
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
                  <FileTypeIcon mimeType={file.mimeType} size={24} />
                </Box>

                {/* File / Folder Details */}
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
                      title={file.name}
                    >
                      {file.name}
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

                  {/* Metadata Row */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <span>{visuals.label}</span>
                      {!isFolder && file.size > 0 && (
                        <>
                          <span>•</span>
                          <span style={{ fontWeight: 600 }}>{formatFileSize(file.size)}</span>
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
        })()}

        {/* ── Source → Destination Accounts Flow ── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr' },
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {/* Source Account Box */}
          {srcAccount && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                minHeight: 64,
                borderRadius: 2.25,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06)',
              }}
            >
              <Avatar
                src={srcAccount.picture}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: getAccountColor(srcAccount.email),
                  fontSize: 12,
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                {!srcAccount.picture && getInitials(srcAccount.email)}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>
                    From (Source)
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.84rem', color: 'text.primary', lineHeight: 1.25 }}>
                  {srcAccount.name || srcAccount.email}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.7rem' }}>
                  {srcAccount.email}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Directional Icon Badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              py: { xs: 0.25, sm: 0 },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
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
          <Box sx={{ minWidth: 0 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="destination-account-label" sx={{ fontSize: '0.82rem' }}>To (Target Account)</InputLabel>
              <Select
                labelId="destination-account-label"
                value={destEmail}
                label="To (Target Account)"
                onChange={(e) => {
                  setDestEmail(e.target.value);
                  setState(STATE.IDLE);
                  setErrorMsg('');
                }}
                disabled={state !== STATE.IDLE || otherAccounts.length === 0}
                renderValue={(val) => {
                  const acc = otherAccounts.find((a) => a.email === val);
                  return acc ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, py: 0.25 }}>
                      <Avatar
                        src={acc.picture}
                        sx={{ width: 26, height: 26, bgcolor: getAccountColor(acc.email), fontSize: 10, flexShrink: 0 }}
                      >
                        {!acc.picture && getInitials(acc.email)}
                      </Avatar>
                      <Box sx={{ minWidth: 0, textAlign: 'left' }}>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.82rem', lineHeight: 1.2 }}>
                          {acc.name || acc.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.68rem' }}>
                          {acc.email}
                        </Typography>
                      </Box>
                    </Box>
                  ) : val;
                }}
                sx={{
                  minHeight: 64,
                  borderRadius: 2.25,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  fontSize: '0.8125rem',
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    py: 1,
                  },
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                {otherAccounts.length === 0 ? (
                  <MenuItem disabled>No other accounts connected</MenuItem>
                ) : (
                  otherAccounts.map((acc) => (
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
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* ── Destination Folder Picker Card ── */}
        {destEmail && state === STATE.IDLE && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
              <Typography variant="body2" fontWeight={500} sx={{ flex: 1, fontSize: '0.8125rem' }} noWrap>
                {destFolder.name}
              </Typography>
              {destFolder.id !== 'root' && (
                <Chip
                  label="custom location"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.63rem' }}
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

        {/* ── No other accounts message ── */}
        {otherAccounts.length === 0 && (
          <Alert severity="warning" icon={<Cloud size={18} />} sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={500}>
              Connect at least one more Google Drive account to use cross-account copying.
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 0.5 }} />

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
            <Loader2 size={22} className="animate-spin text-blue-500" style={{ flexShrink: 0 }} />
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
              <CopyPlus size={18} className="text-blue-500" style={{ flexShrink: 0 }} />
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
                    background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  },
                }}
              />
            ) : (
              <LinearProgress variant="indeterminate" sx={{ borderRadius: 3, height: 6 }} />
            )}
          </Box>
        )}

        {/* ── Single Binary File Progress ── */}
        {state === STATE.RUNNING && !isFolder && !isGApps && (
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
                    Direct browser in-memory pipe
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#3b82f6', fontSize: '0.9rem' }}>
                  {fileProgress}%
                </Typography>
                {file.size > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block' }}>
                    {formatFileSize(Math.round((file.size * fileProgress) / 100))} / {formatFileSize(file.size)}
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
                  background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                },
              }}
            />
          </Box>
        )}

        {/* ── Google Apps Spinner ── */}
        {state === STATE.RUNNING && !isFolder && isGApps && (
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
                Google Workspace Document is duplicated directly within Google Cloud servers.
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
                "{file?.name}" is now accessible in {destAccount?.email}'s Drive
                {destFolder.id !== 'root' ? ` (inside "${destFolder.name}")` : ''}.
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
                : isGApps
                ? 'Google Docs and Sheets are copied directly server-side without downloading.'
                : 'Direct in-memory transfer between cloud endpoints.'}
            </Typography>
          </Alert>
        )}

        {/* ── Footer Actions ── */}
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
                disabled={state === STATE.RUNNING || state === STATE.COUNTING}
                className="w-full sm:w-auto"
              >
                Cancel
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
      </Box>
    </Modal>
  );
};

