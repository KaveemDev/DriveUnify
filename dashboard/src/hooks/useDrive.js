import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  addAccount, removeAccount, setFiles, upsertFiles,
  removeFile, updateFile, setLoading, setError,
  setCurrentFolder, setSelectedAccount, updateAccount,
} from '../store/slices/driveSlice';
import { setConnectModalOpen } from '../store/slices/uiSlice';
import {
  requestDriveAccess,
  checkAndRefreshToken,
  revokeDriveAccess,
  refreshDriveToken,
} from '../services/google-drive/auth';
import {
  requestDropboxAccess,
  checkAndRefreshDropboxToken,
  revokeDropboxAccess,
  refreshDropboxToken,
} from '../services/dropbox/auth';
import {
  fetchAllFilesForAccount as fetchAllDriveFiles,
  fetchFilesInFolder as fetchDriveFilesInFolder,
  fetchStorageInfo as fetchDriveStorageInfo,
} from '../services/google-drive/files';
import {
  fetchAllDropboxFilesForAccount,
  fetchDropboxFilesInFolder,
  fetchDropboxStorageInfo,
} from '../services/dropbox/files';
import {
  renameFile, deleteFile, permanentlyDeleteFile, starFile, restoreFile,
} from '../api/googleDriveApi';
import {
  renameDropboxItem,
  deleteDropboxItem,
  resolveDropboxPath,
} from '../api/dropboxApi';
import {
  addConnectedAccount,
  removeConnectedAccount,
  updateAccountTokens,
} from '../services/firebase/firestore';

const isDropbox = (accountOrFile) =>
  (accountOrFile?.provider || '').toLowerCase().includes('dropbox');

export const useDrive = () => {
  const dispatch = useDispatch();
  const { connectedAccounts, files, loading, error, currentFolder } = useSelector(s => s.drive);
  const { user } = useSelector(s => s.auth);

  // ── Unified Storage & Files Telemetry Wrappers ────────────────
  const getAccountFiles = useCallback(async (account) => {
    if (isDropbox(account)) {
      return await fetchAllDropboxFilesForAccount(account);
    }
    return await fetchAllDriveFiles(account);
  }, []);

  const getAccountStorage = useCallback(async (account) => {
    if (isDropbox(account)) {
      return await fetchDropboxStorageInfo(account);
    }
    return await fetchDriveStorageInfo(account);
  }, []);

  // ── Get fresh account with token check ───────────────────────
  const getFreshAccount = useCallback(async (account) => {
    try {
      const refreshed = isDropbox(account)
        ? await checkAndRefreshDropboxToken(account)
        : await checkAndRefreshToken(account);

      if (!refreshed || refreshed.needsReconnect || refreshed.expired || !refreshed.accessToken) {
        dispatch(updateAccount({
          email: account.email,
          accessToken: null,
          needsReconnect: true,
          expired: true,
        }));
        return { ...account, accessToken: null, needsReconnect: true, expired: true };
      }

      if (refreshed.accessToken !== account.accessToken) {
        const expiryDate = refreshed.expiryDate || (Date.now() + 3600 * 1000);
        dispatch(updateAccount({
          email: account.email,
          accessToken: refreshed.accessToken,
          expiryDate,
          needsReconnect: false,
          expired: false,
        }));
        if (user?.uid) {
          try {
            await updateAccountTokens(user.uid, account.email, {
              expiryDate,
            });
          } catch (err) {
            console.warn('[DriveUnify] Non-fatal: Direct token update failed:', err.message);
          }
        }
      }
      return refreshed;
    } catch (err) {
      // Temporary failure: skip this account for now instead of forcing a reconnect
      console.warn(`[DriveUnify] Token refresh failed for ${account.email}, will retry:`, err.message);
      return { ...account, accessToken: null };
    }
  }, [dispatch, user?.uid]);

  // ── Connect a new account (Google Drive or Dropbox) ───────────
  const connectNewAccount = useCallback(async (provider = 'google_drive', customAppKey = null) => {
    try {
      let oauthData;
      const isDbx = provider === 'dropbox';

      if (isDbx) {
        oauthData = await requestDropboxAccess(customAppKey);
      } else {
        oauthData = await requestDriveAccess();
      }

      const accountData = {
        email: oauthData.email,
        name: oauthData.name,
        picture: oauthData.picture,
        accessToken: oauthData.accessToken,
        refreshToken: oauthData.refreshToken || null,
        clientId: oauthData.clientId || customAppKey || null,
        expiryDate: oauthData.expiryDate,
        provider: isDbx ? 'dropbox' : 'google_drive',
        expired: false,
        needsReconnect: false,
      };

      dispatch(addAccount(accountData));

      // Save metadata (no token) to Firestore — CF already stored both token & metadata
      if (user?.uid) {
        try {
          await addConnectedAccount(user.uid, accountData);
        } catch (err) {
          console.warn('[DriveUnify] Note: CF already stored metadata. Direct Firestore write skipped:', err.message);
        }
      }

      const providerLabel = isDbx ? 'Dropbox' : 'Google Drive';
      toast.success(`Connected ${providerLabel} (${oauthData.email})`);
      dispatch(setConnectModalOpen(false));

      // Fetch files for the new account
      const filesData = await getAccountFiles(accountData);
      dispatch(upsertFiles(filesData));

      // Fetch storage info
      const storage = await getAccountStorage(accountData);
      dispatch(updateAccount({ email: accountData.email, storage }));

      return accountData;
    } catch (err) {
      if (err.message?.includes('closed') || err.message?.includes('popup')) return;
      toast.error(`Failed to connect: ${err.message}`);
      throw err;
    }
  }, [dispatch, user?.uid, getAccountFiles, getAccountStorage]);

  const connectDropboxAccount = useCallback(async (customAppKey = null) => {
    return connectNewAccount('dropbox', customAppKey);
  }, [connectNewAccount]);

  // ── Disconnect an account ─────────────────────────────────────
  const disconnectAccount = useCallback(async (email) => {
    const account = connectedAccounts.find(a => a.email === email);
    try {
      dispatch(removeAccount(email));

      if (isDropbox(account)) {
        await revokeDropboxAccess(email, account?.accessToken);
      } else {
        await revokeDriveAccess(email);
      }

      if (user?.uid) {
        try {
          await removeConnectedAccount(user.uid, email);
        } catch (err) {
          console.warn('[DriveUnify] Direct Firestore removal skipped:', err.message);
        }
      }

      toast.success(`Disconnected ${email}`);
    } catch (err) {
      toast.error(`Failed to disconnect: ${err.message}`);
    }
  }, [dispatch, user?.uid, connectedAccounts]);

  // ── Re-connect an expired account ────────────────────────────
  const reconnectAccount = useCallback(async (email) => {
    const account = connectedAccounts.find(a => a.email === email);
    if (!account) return;

    const isDbx = isDropbox(account);

    try {
      // First try silent refresh via Cloud Function; on any failure fall through to the OAuth popup
      const refreshed = await (isDbx ? refreshDropboxToken(account) : refreshDriveToken(account)).catch(() => null);

      if (refreshed && !refreshed.needsReconnect) {
        dispatch(updateAccount({
          email: refreshed.email,
          accessToken: refreshed.accessToken,
          expiryDate: refreshed.expiryDate,
          needsReconnect: false,
          expired: false,
        }));
        toast.success(`Reconnected ${email}`);

        // Refresh files for this account
        const accountFiles = await getAccountFiles(refreshed);
        const otherFiles = files.filter(f => f.accountEmail !== email);
        dispatch(setFiles([...otherFiles, ...accountFiles]));
        return;
      }

      // Silent refresh failed — show OAuth popup
      const storedClientId = typeof window !== 'undefined' ? localStorage.getItem('driveunify_dropbox_client_id') : null;
      const keyToUse = account.clientId || storedClientId || import.meta.env.VITE_DROPBOX_CLIENT_ID;

      if (isDbx && !keyToUse) {
        dispatch(setConnectModalOpen(true));
        toast('Please enter your Dropbox App Key to reconnect.', { icon: '🔑' });
        return;
      }

      const oauthData = isDbx
        ? await requestDropboxAccess(keyToUse)
        : await requestDriveAccess();

      if (oauthData.email !== email) {
        toast.error(`Please sign in with the same account (${email}) to reconnect`);
        return;
      }

      dispatch(updateAccount({
        email,
        accessToken: oauthData.accessToken,
        refreshToken: oauthData.refreshToken || account.refreshToken || null,
        clientId: oauthData.clientId || account.clientId || keyToUse || null,
        expiryDate: oauthData.expiryDate,
        needsReconnect: false,
        expired: false,
      }));

      toast.success(`Reconnected ${email}`);

      const accountFiles = await getAccountFiles({ ...account, accessToken: oauthData.accessToken });
      const otherFiles = files.filter(f => f.accountEmail !== email);
      dispatch(setFiles([...otherFiles, ...accountFiles]));
    } catch (err) {
      if (err.message?.includes('closed') || err.message?.includes('popup')) return;
      toast.error(`Failed to reconnect ${email}: ${err.message}`);
    }
  }, [dispatch, connectedAccounts, files, getAccountFiles]);

  // ── Fetch files for all accounts ─────────────────────────────
  const fetchFilesForAllAccounts = useCallback(async () => {
    if (connectedAccounts.length === 0) return;
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const checkedAccounts = await Promise.all(
        connectedAccounts.map(account => getFreshAccount(account))
      );

      const validAccounts = checkedAccounts.filter(
        a => !a.needsReconnect && !a.expired && a.accessToken
      );

      if (validAccounts.length === 0) {
        dispatch(setLoading(false));
        return;
      }

      const results = await Promise.allSettled(
        validAccounts.map(account => getAccountFiles(account))
      );

      const allFiles = [];
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          allFiles.push(...result.value);
        } else {
          console.warn(`[DriveUnify] Could not fetch files for ${validAccounts[i].email}:`, result.reason?.message);
        }
      });

      dispatch(setFiles(allFiles));

      // Fetch storage info in parallel
      const storageResults = await Promise.allSettled(
        validAccounts.map(account => getAccountStorage(account))
      );
      storageResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          dispatch(updateAccount({ email: validAccounts[i].email, storage: result.value }));
        }
      });
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [connectedAccounts, dispatch, getFreshAccount, getAccountFiles, getAccountStorage]);

  // ── Navigate to folder ────────────────────────────────────────
  const navigateToFolder = useCallback(async (folder, accountEmail) => {
    const account = connectedAccounts.find(a => a.email === accountEmail);
    if (!account) return;

    dispatch(setCurrentFolder({ ...folder, accountEmail }));
    dispatch(setLoading(true));

    try {
      const freshAccount = await getFreshAccount(account);
      let folderFiles = [];

      if (isDropbox(account)) {
        folderFiles = await fetchDropboxFilesInFolder(freshAccount, folder.pathLower || folder.id);
      } else {
        folderFiles = await fetchDriveFilesInFolder(freshAccount, folder.id);
      }
      dispatch(setFiles(folderFiles));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, connectedAccounts, getFreshAccount]);

  // ── Navigate to root ──────────────────────────────────────────
  const navigateToRoot = useCallback(() => {
    dispatch(setCurrentFolder(null));
    fetchFilesForAllAccounts();
  }, [dispatch, fetchFilesForAllAccounts]);

  // ── Refresh single account ────────────────────────────────────
  const refreshAccount = useCallback(async (email) => {
    const account = connectedAccounts.find(a => a.email === email);
    if (!account) return;

    try {
      const freshAccount = await getFreshAccount(account);
      const accountFiles = await getAccountFiles(freshAccount);
      const otherFiles = files.filter(f => f.accountEmail !== email);
      dispatch(setFiles([...otherFiles, ...accountFiles]));
      toast.success(`Refreshed ${email}`);
    } catch (err) {
      toast.error(`Failed to refresh ${email}: ${err.message}`);
    }
  }, [dispatch, connectedAccounts, files, getFreshAccount, getAccountFiles]);

  // ── Rename file ───────────────────────────────────────────────
  const renameFileAction = useCallback(async (file, newName) => {
    const account = connectedAccounts.find(a => a.email === file.accountEmail);
    if (!account) return;

    dispatch(updateFile({ id: file.id, accountEmail: file.accountEmail, name: newName }));

    try {
      const freshAccount = await getFreshAccount(account);
      if (isDropbox(file) || isDropbox(account)) {
        const parentPath = file.parents?.[0] || 'root';
        const targetPath = resolveDropboxPath(parentPath, newName);
        await renameDropboxItem(freshAccount.accessToken, file.pathLower || file.id, targetPath);
      } else {
        await renameFile(freshAccount.accessToken, file.id, newName, file.accountEmail);
      }
      toast.success('File renamed');
    } catch (err) {
      dispatch(updateFile({ id: file.id, accountEmail: file.accountEmail, name: file.name }));
      toast.error(`Failed to rename: ${err.message}`);
    }
  }, [dispatch, connectedAccounts, getFreshAccount]);

  // ── Delete file (trash / remove) ──────────────────────────────
  const deleteFileAction = useCallback(async (file) => {
    const account = connectedAccounts.find(a => a.email === file.accountEmail);
    if (!account) return;

    dispatch(removeFile({ id: file.id, accountEmail: file.accountEmail }));

    try {
      const freshAccount = await getFreshAccount(account);
      if (isDropbox(file) || isDropbox(account)) {
        await deleteDropboxItem(freshAccount.accessToken, file.pathLower || file.id);
        toast.success(`"${file.name}" deleted from Dropbox`);
      } else {
        await deleteFile(freshAccount.accessToken, file.id, file.accountEmail);
        toast.success(`"${file.name}" moved to trash`);
      }
    } catch (err) {
      dispatch(upsertFiles([file]));
      toast.error(`Failed to delete: ${err.message}`);
    }
  }, [dispatch, connectedAccounts, getFreshAccount]);

  // ── Permanently delete ────────────────────────────────────────
  const permanentlyDeleteFileAction = useCallback(async (file) => {
    const account = connectedAccounts.find(a => a.email === file.accountEmail);
    if (!account) return;

    dispatch(removeFile({ id: file.id, accountEmail: file.accountEmail }));

    try {
      const freshAccount = await getFreshAccount(account);
      if (isDropbox(file) || isDropbox(account)) {
        await deleteDropboxItem(freshAccount.accessToken, file.pathLower || file.id);
      } else {
        await permanentlyDeleteFile(freshAccount.accessToken, file.id, file.accountEmail);
      }
      toast.success(`"${file.name}" permanently deleted`);
    } catch (err) {
      dispatch(upsertFiles([file]));
      toast.error(`Failed to delete: ${err.message}`);
    }
  }, [dispatch, connectedAccounts, getFreshAccount]);

  // ── Star/unstar ───────────────────────────────────────────────
  const toggleStar = useCallback(async (file) => {
    const account = connectedAccounts.find(a => a.email === file.accountEmail);
    if (!account) return;

    const newStarred = !file.starred;
    dispatch(updateFile({ id: file.id, accountEmail: file.accountEmail, starred: newStarred }));

    try {
      const freshAccount = await getFreshAccount(account);
      if (!isDropbox(account)) {
        await starFile(freshAccount.accessToken, file.id, newStarred, file.accountEmail);
      }
    } catch {
      dispatch(updateFile({ id: file.id, accountEmail: file.accountEmail, starred: file.starred }));
    }
  }, [dispatch, connectedAccounts, getFreshAccount]);

  // ── Restore file from trash ───────────────────────────────────
  const restoreFileAction = useCallback(async (file) => {
    const account = connectedAccounts.find(a => a.email === file.accountEmail);
    if (!account) return;

    dispatch(updateFile({ id: file.id, accountEmail: file.accountEmail, trashed: false }));

    try {
      const freshAccount = await getFreshAccount(account);
      if (!isDropbox(account)) {
        await restoreFile(freshAccount.accessToken, file.id, file.accountEmail);
        toast.success(`Restored "${file.name}"`);
      }
    } catch (err) {
      dispatch(updateFile({ id: file.id, accountEmail: file.accountEmail, trashed: true }));
      toast.error(`Failed to restore: ${err.message}`);
    }
  }, [dispatch, connectedAccounts, getFreshAccount]);

  return {
    connectedAccounts, files, loading, error, currentFolder,
    connectNewAccount, connectDropboxAccount, disconnectAccount, reconnectAccount,
    fetchFilesForAllAccounts, refreshAccount,
    navigateToFolder, navigateToRoot,
    renameFileAction, deleteFileAction, permanentlyDeleteFileAction, toggleStar,
    restoreFileAction,
  };
};
