import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  addAccount, removeAccount, setCurrentFolder, updateAccount,
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
  renameFile, deleteFile, permanentlyDeleteFile, starFile, restoreFile, listFiles,
} from '../api/googleDriveApi';
import { normalizeFile as normalizeDriveFile } from '../services/google-drive/files';
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
import { getAccountId, getFileAccountId, findAccountById, findAccountForFile } from '../utils/helpers';
import { queryClient } from '../config/queryClient';

const isDropbox = (accountOrFile) =>
  (accountOrFile?.provider || '').toLowerCase().includes('dropbox');

const isUsable = (account) => !account.needsReconnect && !account.expired && !!account.accessToken;

// Query keys: ['files', accountId, folderKey] and ['storage', accountId]
const filesKey = (accountId, folderKey) => ['files', accountId, folderKey];

const sameFile = (a, b) => a.id === b.id && a.accountEmail === b.accountEmail;

// Patch every cached file list of the file's account (root + folders)
const patchFiles = (file, fn, filters = {}) =>
  queryClient.setQueriesData({ queryKey: ['files', getFileAccountId(file)], ...filters }, (old) => old && fn(old));

const updateCachedFile = (file, fields) =>
  patchFiles(file, (list) => list.map(f => (sameFile(f, file) ? { ...f, ...fields } : f)));
const removeCachedFile = (file) =>
  patchFiles(file, (list) => list.filter(f => !sameFile(f, file)));
// Only the lists on screen, so an upload doesn't land in unrelated cached folders
export const upsertCachedFile = (file) =>
  patchFiles(file, (list) => [...list.filter(f => !sameFile(f, file)), file], { type: 'active' });

const getAccountFiles = (account) =>
  isDropbox(account) ? fetchAllDropboxFilesForAccount(account) : fetchAllDriveFiles(account);

const getAccountStorage = (account) =>
  isDropbox(account) ? fetchDropboxStorageInfo(account) : fetchDriveStorageInfo(account);

// ── Get fresh account with token check ───────────────────────
const useFreshAccount = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);

  return useCallback(async (account) => {
    try {
      const refreshed = isDropbox(account)
        ? await checkAndRefreshDropboxToken(account)
        : await checkAndRefreshToken(account);

      if (!refreshed || refreshed.needsReconnect || refreshed.expired || !refreshed.accessToken) {
        dispatch(updateAccount({
          id: getAccountId(account),
          accessToken: null,
          needsReconnect: true,
          expired: true,
        }));
        return { ...account, accessToken: null, needsReconnect: true, expired: true };
      }

      if (refreshed.accessToken !== account.accessToken) {
        const expiryDate = refreshed.expiryDate || (Date.now() + 3600 * 1000);
        dispatch(updateAccount({
          id: getAccountId(account),
          accessToken: refreshed.accessToken,
          expiryDate,
          needsReconnect: false,
          expired: false,
        }));
        if (user?.uid) {
          try {
            await updateAccountTokens(user.uid, getAccountId(account), {
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
};

const requireToken = (account) => {
  if (!account.accessToken) throw new Error(`No valid token for ${account.email}`);
  return account;
};

// ── Files for the current view: every account at root, or the open folder ──
export const useDriveFiles = () => {
  const { connectedAccounts, currentFolder } = useSelector(s => s.drive);
  const getFreshAccount = useFreshAccount();

  const folderAccount = currentFolder && findAccountById(connectedAccounts, getFileAccountId(currentFolder));
  const accounts = currentFolder
    ? (folderAccount ? [folderAccount] : [])
    : connectedAccounts.filter(isUsable);

  return useQueries({
    queries: accounts.map(account => ({
      queryKey: filesKey(getAccountId(account), currentFolder ? (currentFolder.pathLower || currentFolder.id) : 'root'),
      queryFn: async () => {
        const fresh = requireToken(await getFreshAccount(account));
        if (!currentFolder) return getAccountFiles(fresh);
        return isDropbox(account)
          ? fetchDropboxFilesInFolder(fresh, currentFolder.pathLower || currentFolder.id)
          : fetchDriveFilesInFolder(fresh, currentFolder.id);
      },
    })),
    combine: (results) => ({
      files: results.flatMap(r => r.data ?? []),
      isFetching: results.some(r => r.isFetching),
    }),
  });
};

// ── One account's folder (null = root); shares cache keys with useDriveFiles ──
export const useFolderFiles = (account, folder) => {
  const getFreshAccount = useFreshAccount();
  const folderKey = folder ? (folder.pathLower || folder.id) : 'root';
  return useQuery({
    queryKey: filesKey(account ? getAccountId(account) : '', folderKey),
    queryFn: async () => {
      const fresh = requireToken(await getFreshAccount(account));
      if (!folder) return getAccountFiles(fresh);
      return isDropbox(account) ? fetchDropboxFilesInFolder(fresh, folderKey) : fetchDriveFilesInFolder(fresh, folder.id);
    },
    enabled: !!account && isUsable(account),
  });
};

// Every file the account owns, at any depth (Dropbox's listing is already recursive)
const getAccountFilesDeep = async (account) => {
  if (isDropbox(account)) return fetchAllDropboxFilesForAccount(account);
  const all = [];
  let pageToken = null;
  do {
    const res = await listFiles(account.accessToken, {
      folderId: null, pageSize: 1000, pageToken, orderBy: 'modifiedTime desc', query: "'me' in owners",
    }, account.email);
    all.push(...(res?.files || []).map(f => normalizeDriveFile(f, account.email)));
    pageToken = res?.nextPageToken || null;
  } while (pageToken);
  return all;
};

// ── Full per-account listings for the storage analytics view ──
export const useAllAccountFiles = ({ enabled = true, refetchInterval } = {}) => {
  const { connectedAccounts } = useSelector(s => s.drive);
  const getFreshAccount = useFreshAccount();
  const usable = connectedAccounts.filter(isUsable);

  return useQueries({
    queries: usable.map(account => ({
      queryKey: ['allFiles', getAccountId(account)],
      queryFn: async () => getAccountFilesDeep(requireToken(await getFreshAccount(account))),
      enabled,
      refetchInterval,
    })),
    combine: (results) => ({
      byAccount: Object.fromEntries(usable.map((a, i) => [getAccountId(a), results[i]])),
      files: results.flatMap(r => r.data ?? []),
      isFetching: results.some(r => r.isFetching),
      isLoading: results.some(r => r.isLoading),
      updatedAt: Math.max(0, ...results.map(r => r.dataUpdatedAt || 0)),
    }),
  });
};

// ── Connected accounts with their storage quota merged in ────
export const useAccountsWithStorage = ({ refetchInterval } = {}) => {
  const { connectedAccounts } = useSelector(s => s.drive);
  const getFreshAccount = useFreshAccount();
  const usable = connectedAccounts.filter(isUsable);

  const storage = useQueries({
    queries: usable.map(account => ({
      queryKey: ['storage', getAccountId(account)],
      queryFn: async () => getAccountStorage(requireToken(await getFreshAccount(account))),
      refetchInterval,
    })),
  });

  return useMemo(() => {
    const byId = {};
    usable.forEach((a, i) => { byId[getAccountId(a)] = storage[i].data; });
    return connectedAccounts.map(a => ({ ...a, storage: byId[getAccountId(a)] ?? a.storage }));
  }, [connectedAccounts, storage]); // eslint-disable-line react-hooks/exhaustive-deps
};

export const useDrive = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { connectedAccounts, currentFolder } = useSelector(s => s.drive);
  const { user } = useSelector(s => s.auth);
  const getFreshAccount = useFreshAccount();

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
          // An older Cloud Function stored Dropbox metadata under the bare email id, overwriting a
          // same-email Drive record; rewrite those siblings so they survive a reload.
          const siblings = connectedAccounts.filter(
            a => a.email === accountData.email && getAccountId(a) !== getAccountId(accountData)
          );
          await Promise.all(siblings.map(({ email, name, picture, provider, clientId }) =>
            addConnectedAccount(user.uid, { email, name, picture, provider, clientId: clientId || null })
          ));
        } catch (err) {
          console.warn('[DriveUnify] Note: CF already stored metadata. Direct Firestore write skipped:', err.message);
        }
      }

      const providerLabel = isDbx ? 'Dropbox' : 'Google Drive';
      toast.success(`Connected ${providerLabel} (${oauthData.email})`);
      dispatch(setConnectModalOpen(false));

      // useDriveFiles / useAccountsWithStorage start fetching once the account is in the store
      return accountData;
    } catch (err) {
      if (err.message?.includes('closed') || err.message?.includes('popup')) return;
      toast.error(`Failed to connect: ${err.message}`);
      throw err;
    }
  }, [dispatch, user?.uid, connectedAccounts]);

  const connectDropboxAccount = useCallback(async (customAppKey = null) => {
    return connectNewAccount('dropbox', customAppKey);
  }, [connectNewAccount]);

  // ── Disconnect an account ─────────────────────────────────────
  const disconnectAccount = useCallback(async (accountId) => {
    const account = findAccountById(connectedAccounts, accountId);
    if (!account) return;
    const { email } = account;
    try {
      dispatch(removeAccount(accountId));
      queryClient.removeQueries({ queryKey: ['files', accountId] });
      queryClient.removeQueries({ queryKey: ['storage', accountId] });
      queryClient.removeQueries({ queryKey: ['allFiles', accountId] });

      if (isDropbox(account)) {
        await revokeDropboxAccess(email, account?.accessToken);
      } else {
        await revokeDriveAccess(email);
      }

      if (user?.uid) {
        try {
          await removeConnectedAccount(user.uid, accountId);
        } catch (err) {
          console.warn('[DriveUnify] Direct Firestore removal skipped:', err.message);
        }
      }

      toast.success(`Disconnected ${email}`);
    } catch (err) {
      toast.error(`Failed to disconnect: ${err.message}`);
    }
  }, [dispatch, queryClient, user?.uid, connectedAccounts]);

  const invalidateAccount = useCallback((accountId) => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['files', accountId] }),
    queryClient.invalidateQueries({ queryKey: ['storage', accountId] }),
  ]), [queryClient]);

  // ── Re-connect an expired account ────────────────────────────
  const reconnectAccount = useCallback(async (accountId) => {
    const account = findAccountById(connectedAccounts, accountId);
    if (!account) return;
    const { email } = account;

    const isDbx = isDropbox(account);

    try {
      // First try silent refresh via Cloud Function; on any failure fall through to the OAuth popup
      const refreshed = await (isDbx ? refreshDropboxToken(account) : refreshDriveToken(account)).catch(() => null);

      if (refreshed && !refreshed.needsReconnect) {
        dispatch(updateAccount({
          id: accountId,
          accessToken: refreshed.accessToken,
          expiryDate: refreshed.expiryDate,
          needsReconnect: false,
          expired: false,
        }));
        toast.success(`Reconnected ${email}`);
        invalidateAccount(accountId);
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
        id: accountId,
        accessToken: oauthData.accessToken,
        refreshToken: oauthData.refreshToken || account.refreshToken || null,
        clientId: oauthData.clientId || account.clientId || keyToUse || null,
        expiryDate: oauthData.expiryDate,
        needsReconnect: false,
        expired: false,
      }));

      toast.success(`Reconnected ${email}`);
      invalidateAccount(accountId);
    } catch (err) {
      if (err.message?.includes('closed') || err.message?.includes('popup')) return;
      toast.error(`Failed to reconnect ${email}: ${err.message}`);
    }
  }, [dispatch, connectedAccounts, invalidateAccount]);

  // ── Refetch the files on screen and storage quotas ───────────
  const refreshFiles = useCallback(() => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['files'] }),
    queryClient.invalidateQueries({ queryKey: ['storage'] }),
    queryClient.invalidateQueries({ queryKey: ['allFiles'] }),
  ]), [queryClient]);

  // ── Navigate to folder (useDriveFiles fetches it) ─────────────
  const navigateToFolder = useCallback((folder, accountId) => {
    const account = findAccountById(connectedAccounts, accountId);
    if (!account) return;
    dispatch(setCurrentFolder({ ...folder, accountEmail: account.email, provider: account.provider }));
  }, [dispatch, connectedAccounts]);

  // ── Navigate to root ──────────────────────────────────────────
  const navigateToRoot = useCallback(() => {
    dispatch(setCurrentFolder(null));
  }, [dispatch]);

  // ── Refresh single account ────────────────────────────────────
  const refreshAccount = useCallback(async (accountId) => {
    const account = findAccountById(connectedAccounts, accountId);
    if (!account) return;
    await invalidateAccount(accountId);
    // invalidateQueries swallows fetch errors, so read the result back from the cache
    const failed = queryClient.getQueryCache()
      .findAll({ queryKey: ['files', accountId], type: 'active' })
      .find(q => q.state.status === 'error');
    if (failed) toast.error(`Failed to refresh ${account.email}: ${failed.state.error.message}`);
    else toast.success(`Refreshed ${account.email}`);
  }, [connectedAccounts, queryClient, invalidateAccount]);

  // ── File mutations: optimistic cache patch, undone on error ───
  const withAccount = async (file) => {
    const account = findAccountForFile(connectedAccounts, file);
    return requireToken(await getFreshAccount(account));
  };

  const renameMutation = useMutation({
    mutationFn: async ({ file, newName }) => {
      const fresh = await withAccount(file);
      if (isDropbox(file)) {
        const parentPath = file.parents?.[0] || 'root';
        const targetPath = resolveDropboxPath(parentPath, newName);
        await renameDropboxItem(fresh.accessToken, file.pathLower || file.id, targetPath);
      } else {
        await renameFile(fresh.accessToken, file.id, newName, file.accountEmail);
      }
    },
    onMutate: ({ file, newName }) => updateCachedFile(file, { name: newName }),
    onSuccess: () => toast.success('File renamed'),
    onError: (err, { file }) => {
      updateCachedFile(file, { name: file.name });
      toast.error(`Failed to rename: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ file, permanent }) => {
      const fresh = await withAccount(file);
      if (isDropbox(file)) {
        await deleteDropboxItem(fresh.accessToken, file.pathLower || file.id);
        return `"${file.name}" ${permanent ? 'permanently deleted' : 'deleted from Dropbox'}`;
      }
      if (permanent) {
        await permanentlyDeleteFile(fresh.accessToken, file.id, file.accountEmail);
        return `"${file.name}" permanently deleted`;
      }
      await deleteFile(fresh.accessToken, file.id, file.accountEmail);
      return `"${file.name}" moved to trash`;
    },
    onMutate: ({ file }) => {
      const snapshot = queryClient.getQueriesData({ queryKey: ['files', getFileAccountId(file)] });
      removeCachedFile(file);
      return snapshot;
    },
    onSuccess: (message) => toast.success(message),
    onError: (err, _vars, snapshot) => {
      snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(`Failed to delete: ${err.message}`);
    },
  });

  const starMutation = useMutation({
    mutationFn: async ({ file, starred }) => {
      const fresh = await withAccount(file);
      if (!isDropbox(file)) await starFile(fresh.accessToken, file.id, starred, file.accountEmail);
    },
    onMutate: ({ file, starred }) => updateCachedFile(file, { starred }),
    onError: (_err, { file }) => updateCachedFile(file, { starred: file.starred }),
  });

  const restoreMutation = useMutation({
    mutationFn: async ({ file }) => {
      const fresh = await withAccount(file);
      if (!isDropbox(file)) await restoreFile(fresh.accessToken, file.id, file.accountEmail);
      return !isDropbox(file);
    },
    onMutate: ({ file }) => updateCachedFile(file, { trashed: false }),
    onSuccess: (restored, { file }) => restored && toast.success(`Restored "${file.name}"`),
    onError: (err, { file }) => {
      updateCachedFile(file, { trashed: true });
      toast.error(`Failed to restore: ${err.message}`);
    },
  });

  // Callers fire-and-forget; errors are already toasted by the mutation
  const run = (mutation, vars) =>
    findAccountForFile(connectedAccounts, vars.file) ? mutation.mutateAsync(vars).catch(() => {}) : undefined;

  const renameFileAction = (file, newName) => run(renameMutation, { file, newName });
  const deleteFileAction = (file) => run(deleteMutation, { file, permanent: false });
  const permanentlyDeleteFileAction = (file) => run(deleteMutation, { file, permanent: true });
  const toggleStar = (file) => run(starMutation, { file, starred: !file.starred });
  const restoreFileAction = (file) => run(restoreMutation, { file });

  return {
    connectedAccounts, currentFolder,
    connectNewAccount, connectDropboxAccount, disconnectAccount, reconnectAccount,
    refreshFiles, refreshAccount,
    navigateToFolder, navigateToRoot,
    renameFileAction, deleteFileAction, permanentlyDeleteFileAction, toggleStar,
    restoreFileAction,
  };
};
