/**
 * services/dropbox/files.js
 *
 * File & folder listing and storage telemetry for connected Dropbox accounts.
 */

import {
  listDropboxFiles,
  normalizeDropboxFile,
  getDropboxSpaceUsage,
} from '../../api/dropboxApi';
import { refreshDropboxToken } from './auth';

/**
 * Fetch ALL files & folders for a Dropbox account.
 */
export const fetchAllDropboxFilesForAccount = async (account) => {
  const { accessToken, email } = account;
  if (!accessToken) return [];

  try {
    const entries = await listDropboxFiles(accessToken, '', { recursive: true });
    return entries.map((entry) => normalizeDropboxFile(entry, email));
  } catch (err) {
    if (err.message?.includes('invalid_access_token')) {
      console.warn(`[DriveUnify] Stale token for ${email}, attempting auto-refresh...`);
      const refreshed = await refreshDropboxToken(account);
      if (refreshed?.accessToken) {
        const entries = await listDropboxFiles(refreshed.accessToken, '', { recursive: true });
        return entries.map((entry) => normalizeDropboxFile(entry, email));
      }
    }
    throw err;
  }
};

/**
 * Fetch files & immediate subfolders in a specific Dropbox folder.
 */
export const fetchDropboxFilesInFolder = async (account, folderPathOrId) => {
  const { accessToken, email } = account;
  if (!accessToken) return [];

  const targetPath = (!folderPathOrId || folderPathOrId === 'root') ? '' : folderPathOrId;
  try {
    const entries = await listDropboxFiles(accessToken, targetPath, { recursive: false });
    return entries.map((entry) => normalizeDropboxFile(entry, email));
  } catch (err) {
    if (err.message?.includes('invalid_access_token')) {
      console.warn(`[DriveUnify] Stale token for ${email}, attempting auto-refresh...`);
      const refreshed = await refreshDropboxToken(account);
      if (refreshed?.accessToken) {
        const entries = await listDropboxFiles(refreshed.accessToken, targetPath, { recursive: false });
        return entries.map((entry) => normalizeDropboxFile(entry, email));
      }
    }
    throw err;
  }
};

/**
 * Fetch storage quota info for a Dropbox account.
 */
export const fetchDropboxStorageInfo = async (account) => {
  const { accessToken, email } = account;
  if (!accessToken) return { used: 0, limit: 0, usedPercent: 0 };

  try {
    return await getDropboxSpaceUsage(accessToken);
  } catch (err) {
    if (err.message?.includes('invalid_access_token')) {
      console.warn(`[DriveUnify] Stale token for ${email || 'account'}, attempting auto-refresh...`);
      const refreshed = await refreshDropboxToken(account);
      if (refreshed?.accessToken) {
        return await getDropboxSpaceUsage(refreshed.accessToken);
      }
    }
    throw err;
  }
};
