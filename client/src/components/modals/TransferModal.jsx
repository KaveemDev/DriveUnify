import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Avatar, Alert, LinearProgress,
  FormControl, InputLabel, Select, MenuItem, Chip,
  Divider, IconButton, Skeleton, Tooltip,
} from '@mui/material';
import {
  ArrowRight, CheckCircle2, XCircle, Loader2,
  FileText, Image, FileVideo, FileAudio, Archive, File,
  Cloud, Folder, FolderOpen, ChevronRight, ChevronLeft,
  Home, CopyPlus,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { transferFile, transferFolder, countFilesInFolder } from '../../services/google-drive/transfer';
import { listFoldersInFolder } from '../../api/googleDriveApi';
import { getAccountColor } from '../../config/constants';
import { getInitials } from '../../utils/formatters';
import { formatFileSize } from '../../utils/formatters';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────

const FOLDER_MIME = 'application/vnd.google-apps.folder';

const isFolderFile = (file) => file?.mimeType === FOLDER_MIME;

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
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Avatar
      src={account.picture}
      sx={{ width: 20, height: 20, bgcolor: getAccountColor(account.email), fontSize: 9 }}
    >
      {!account.picture && getInitials(account.email)}
    </Avatar>
    <Typography variant="caption" noWrap>{account.email}</Typography>
  </Box>
);

// ── Folder Picker Sub-Component ───────────────────────────────

const FolderPicker = ({ destAccount, selectedFolder, onSelect }) => {
  // path = array of { id, name } breadcrumb segments
  const [path, setPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentId = path.length > 0 ? path[path.length - 1].id : 'root';

  // Load folders whenever the current folder or dest account changes
  useEffect(() => {
    if (!destAccount?.accessToken) return;
    setLoading(true);
    setError(null);
    listFoldersInFolder(destAccount.accessToken, currentId, destAccount.email)
      .then((res) => setFolders(res?.files || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentId, destAccount?.email]);

  // Reset when dest account changes
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
        borderColor: 'primary.main',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header / Breadcrumb */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        {/* Back button */}
        <Tooltip title="Go back">
          <span>
            <IconButton size="small" onClick={navigateBack} disabled={path.length === 0}>
              <ChevronLeft size={16} />
            </IconButton>
          </span>
        </Tooltip>
        {/* Root button */}
        <Tooltip title="My Drive root">
          <span>
            <IconButton size="small" onClick={navigateToRoot} disabled={path.length === 0}>
              <Home size={14} />
            </IconButton>
          </span>
        </Tooltip>

        {/* Breadcrumb trail */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
            My Drive
          </Typography>
          {path.map((seg, i) => (
            <Box key={seg.id} sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
              <ChevronRight size={12} style={{ color: 'text.secondary', flexShrink: 0 }} />
              <Typography
                variant="caption"
                color={i === path.length - 1 ? 'text.primary' : 'text.secondary'}
                fontWeight={i === path.length - 1 ? 600 : 400}
                noWrap
                sx={{ maxWidth: 100, cursor: i < path.length - 1 ? 'pointer' : 'default' }}
                onClick={() => i < path.length - 1 && setPath(path.slice(0, i + 1))}
              >
                {seg.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Folder list */}
      <Box sx={{ maxHeight: 160, overflowY: 'auto', p: 0.5 }}>
        {loading ? (
          <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={28} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        ) : error ? (
          <Typography variant="caption" color="error" sx={{ p: 1.5, display: 'block' }}>
            {error}
          </Typography>
        ) : folders.length === 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ p: 1.5, display: 'block', textAlign: 'center' }}>
            No subfolders here
          </Typography>
        ) : (
          folders.map((folder) => (
            <Box
              key={folder.id}
              onClick={() => navigateInto(folder)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1,
                py: 0.75,
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Folder size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <Typography variant="caption" noWrap sx={{ flex: 1 }}>{folder.name}</Typography>
              <ChevronRight size={12} style={{ color: 'text.disabled', flexShrink: 0 }} />
            </Box>
          ))
        )}
      </Box>

      {/* Footer: select current folder */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <FolderOpen size={14} style={{ color: '#6366f1' }} />
          <Typography variant="caption" color="primary.main" fontWeight={500}>
            {currentDisplayName}
          </Typography>
        </Box>
        <Button
          variant={isSelected ? 'primary' : 'outline'}
          size="xs"
          onClick={() => onSelect({ id: currentId, name: currentDisplayName })}
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
  COUNTING: 'counting',   // pre-counting files for folder transfers
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

  // File transfer progress (for single binary file)
  const [fileProgress, setFileProgress] = useState(0);

  // Folder transfer progress
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
          total = 0; // fall back to indeterminate
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

  // ── Render ───────────────────────────────────────────────────

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={isFolder ? 'Copy Folder to Drive' : 'Copy File to Drive'}
      description={
        isFolder
          ? 'Recursively copy this folder and all its contents to another connected Drive account.'
          : 'Copy this file to another connected Google Drive account — no download needed.'
      }
      size="md"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* ── Item Info Card ── */}
        {file && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: isFolder ? 'warning.main' : 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
                opacity: 0.9,
              }}
            >
              <FileTypeIcon mimeType={file.mimeType} size={20} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {file.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                {!isFolder && file.size > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                )}
                <Chip
                  label={
                    isFolder
                      ? 'Folder (recursive copy)'
                      : isGApps
                      ? 'Server-side copy'
                      : 'In-memory transfer'
                  }
                  size="small"
                  variant="outlined"
                  color={isFolder ? 'warning' : isGApps ? 'success' : 'info'}
                  sx={{ height: 18, fontSize: '0.63rem' }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* ── Source → Destination ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {srcAccount && (
            <Box
              sx={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 1,
                p: 1.25, borderRadius: 2, bgcolor: 'action.hover', border: 1, borderColor: 'divider',
              }}
            >
              <Avatar
                src={srcAccount.picture}
                sx={{ width: 26, height: 26, bgcolor: getAccountColor(srcAccount.email), fontSize: 10, flexShrink: 0 }}
              >
                {!srcAccount.picture && getInitials(srcAccount.email)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.2}>From</Typography>
                <Typography variant="caption" fontWeight={600} noWrap display="block">{srcAccount.email}</Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ color: 'primary.main', flexShrink: 0 }}>
            <ArrowRight size={20} />
          </Box>

          <Box sx={{ flex: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>To account</InputLabel>
              <Select
                value={destEmail}
                label="To account"
                onChange={(e) => {
                  setDestEmail(e.target.value);
                  setState(STATE.IDLE);
                  setErrorMsg('');
                }}
                disabled={state !== STATE.IDLE || otherAccounts.length === 0}
                renderValue={(val) => {
                  const acc = otherAccounts.find((a) => a.email === val);
                  return acc ? <AccountChip account={acc} /> : val;
                }}
              >
                {otherAccounts.length === 0 ? (
                  <MenuItem disabled>No other accounts connected</MenuItem>
                ) : (
                  otherAccounts.map((acc) => (
                    <MenuItem key={acc.email} value={acc.email}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={acc.picture}
                          sx={{ width: 28, height: 28, bgcolor: getAccountColor(acc.email), fontSize: 11 }}
                        >
                          {!acc.picture && getInitials(acc.email)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{acc.name || acc.email}</Typography>
                          <Typography variant="caption" color="text.secondary">{acc.email}</Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* ── Destination Folder Picker ── */}
        {destEmail && state === STATE.IDLE && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Destination folder
              </Typography>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowFolderPicker((v) => !v)}
              >
                {showFolderPicker ? 'Hide browser' : 'Browse folders'}
              </Button>
            </Box>

            {/* Selected folder display */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1.5,
                bgcolor: 'action.hover',
                border: 1,
                borderColor: showFolderPicker ? 'primary.main' : 'divider',
              }}
            >
              <Folder size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <Typography variant="caption" fontWeight={500} sx={{ flex: 1 }} noWrap>
                {destFolder.name}
              </Typography>
              {destFolder.id !== 'root' && (
                <Chip
                  label="custom"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 16, fontSize: '0.6rem' }}
                />
              )}
            </Box>

            {showFolderPicker && destAccount && (
              <Box sx={{ mt: 1 }}>
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
          <Alert severity="warning" icon={<Cloud size={16} />}>
            Connect at least one more Google Drive account to use this feature.
          </Alert>
        )}

        <Divider />

        {/* ── Counting phase (folder only) ── */}
        {state === STATE.COUNTING && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Loader2 size={18} className="animate-spin" style={{ color: '#6366f1', flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" fontWeight={500}>Scanning folder contents…</Typography>
              <Typography variant="caption" color="text.secondary">Counting files before transfer starts.</Typography>
            </Box>
          </Box>
        )}

        {/* ── Folder progress ── */}
        {state === STATE.RUNNING && isFolder && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'action.hover', mb: 1 }}>
              <CopyPlus size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500}>
                  {folderProgress.total > 0
                    ? `${folderProgress.filesDone} / ${folderProgress.total} files copied`
                    : `${folderProgress.filesDone} files copied`}
                </Typography>
                {folderProgress.currentFile && (
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {folderProgress.filesDone < folderProgress.total ? '↳ ' : '✓ '}{folderProgress.currentFile}
                  </Typography>
                )}
              </Box>
            </Box>
            {folderProgress.total > 0 ? (
              <LinearProgress
                variant="determinate"
                value={Math.round((folderProgress.filesDone / folderProgress.total) * 100)}
                sx={{ borderRadius: 2, height: 5 }}
              />
            ) : (
              <LinearProgress variant="indeterminate" sx={{ borderRadius: 2, height: 5 }} />
            )}
          </Box>
        )}

        {/* ── Single binary file progress ── */}
        {state === STATE.RUNNING && !isFolder && !isGApps && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Transferring…</Typography>
              <Typography variant="caption" color="text.secondary">{fileProgress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={fileProgress} sx={{ borderRadius: 2, height: 6 }} />
          </Box>
        )}

        {/* ── Google Apps spinner ── */}
        {state === STATE.RUNNING && !isFolder && isGApps && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Loader2 size={18} className="animate-spin" style={{ color: '#6366f1', flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" fontWeight={500}>Copying on Google's servers…</Typography>
              <Typography variant="caption" color="text.secondary">No data is being downloaded to your device.</Typography>
            </Box>
          </Box>
        )}

        {/* ── Success ── */}
        {state === STATE.SUCCESS && (
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              p: 1.5, borderRadius: 2, bgcolor: 'success.main', color: 'success.contrastText',
            }}
          >
            <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {isFolder ? 'Folder copied!' : 'Copy successful!'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                "{file?.name}" is now in {destAccount?.email}'s Drive
                {destFolder.id !== 'root' ? ` › ${destFolder.name}` : ''}.
              </Typography>
            </Box>
          </Box>
        )}

        {/* ── Error ── */}
        {state === STATE.ERROR && (
          <Alert severity="error" icon={<XCircle size={16} />}>
            {errorMsg}
          </Alert>
        )}

        {/* ── Info hint (idle + dest selected) ── */}
        {state === STATE.IDLE && destEmail && !showFolderPicker && (
          <Alert severity="info" sx={{ py: 0.5 }}>
            <Typography variant="caption">
              {isFolder
                ? '📁 Folder copy is recursive — all nested files and subfolders will be copied. Large folders may take a while.'
                : isGApps
                ? '⚡ Google Docs/Sheets/Slides are copied server-side by Google — zero bytes touch your device.'
                : '📦 Binary files pass through browser memory only. No file is saved to disk.'}
            </Typography>
          </Alert>
        )}

        {/* ── Actions ── */}
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          {state === STATE.SUCCESS ? (
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={state === STATE.RUNNING || state === STATE.COUNTING}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleTransfer}
                disabled={!canTransfer || otherAccounts.length === 0}
                loading={state === STATE.RUNNING || state === STATE.COUNTING}
                icon={CopyPlus}
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
