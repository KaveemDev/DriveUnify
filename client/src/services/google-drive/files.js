import { listFiles, getStorageQuota } from '../../api/googleDriveApi';
import { getMimeTypeCategory } from '../../config/constants';

// ── Normalize a Drive file to unified schema ──────────────────

const normalizeFile = (file, accountEmail) => ({
  id: file.id,
  name: file.name,
  mimeType: file.mimeType,
  category: getMimeTypeCategory(file.mimeType),
  size: file.size ? parseInt(file.size, 10) : 0,
  modifiedTime: file.modifiedTime,
  createdTime: file.createdTime,
  provider: 'google_drive',
  accountEmail,
  parents: file.parents || [],
  iconLink: file.iconLink,
  thumbnailLink: file.thumbnailLink,
  shared: file.shared || false,
  starred: file.starred || false,
  trashed: file.trashed || false,
  capabilities: file.capabilities || {},
  webViewLink: file.webViewLink,
  webContentLink: file.webContentLink,
});

// ── Fetch ALL files for an account (handles pagination) ───────

export const fetchAllFilesForAccount = async (account) => {
  const { accessToken, email } = account;
  const allFiles = [];
  let pageToken = null;

  do {
    const response = await listFiles(
      accessToken,
      { pageToken, pageSize: 100 },
      email
    );

    if (response?.files) {
      allFiles.push(...response.files.map(f => normalizeFile(f, email)));
    }

    pageToken = response?.nextPageToken || null;
  } while (pageToken);

  return allFiles;
};

// ── Fetch files in a specific folder ─────────────────────────

export const fetchFilesInFolder = async (account, folderId) => {
  const { accessToken, email } = account;
  const allFiles = [];
  let pageToken = null;

  do {
    const response = await listFiles(
      accessToken,
      { folderId, pageToken, pageSize: 100 },
      email
    );

    if (response?.files) {
      allFiles.push(...response.files.map(f => normalizeFile(f, email)));
    }

    pageToken = response?.nextPageToken || null;
  } while (pageToken);

  return allFiles;
};

// ── Fetch storage info for an account ────────────────────────

export const fetchStorageInfo = async (account) => {
  const { accessToken, email } = account;
  const data = await getStorageQuota(accessToken, email);
  const quota = data?.storageQuota || {};

  const used = parseInt(quota.usage || '0', 10);
  const limit = parseInt(quota.limit || '0', 10);

  return {
    used,
    limit,
    usedPercent: limit > 0 ? Math.round((used / limit) * 100) : 0,
    usedInDrive: parseInt(quota.usageInDrive || '0', 10),
    usedInDriveTrash: parseInt(quota.usageInDriveTrash || '0', 10),
  };
};
