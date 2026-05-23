/**
 * transfer.js
 *
 * Orchestrates cross-account Google Drive file transfer.
 *
 * Strategy A — Google Apps files (Docs, Sheets, Slides, etc.):
 *   1. Temporarily share source file with destination account (using src token)
 *   2. Call files.copy with destination token → Google copies on their servers
 *   3. Remove the temporary permission (cleanup)
 *   → Zero bytes pass through the browser
 *
 * Strategy B — Binary files (PDFs, images, Office docs, etc.):
 *   1. Download file blob into browser RAM using source token
 *   2. Upload blob to destination drive using multipart upload
 *   → File passes through browser memory only (no disk write, no local file)
 */

import {
  addPermission,
  deletePermission,
  copyFileToDrive,
  downloadFileBlob,
  uploadMultipartToDrive,
  listFolderContents,
  createFolder,
} from '../../api/googleDriveApi';

// Google Apps mime types that support server-side copy
const GOOGLE_APPS_MIME_TYPES = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.drawing',
  'application/vnd.google-apps.form',
  'application/vnd.google-apps.script',
  'application/vnd.google-apps.site',
  'application/vnd.google-apps.jam',
  'application/vnd.google-apps.shortcut',
]);

const isGoogleAppsFile = (mimeType) => GOOGLE_APPS_MIME_TYPES.has(mimeType);

/**
 * Transfer a file from one Drive account to another.
 *
 * @param {object} srcAccount   - { email, accessToken }
 * @param {object} destAccount  - { email, accessToken }
 * @param {object} file         - normalized file object from Drive store
 * @param {string} destFolderId - destination folder ID (default: 'root')
 * @param {function} onProgress - optional (0-100) progress callback for binary files
 * @returns {Promise<object>}   - the created file object in the destination drive
 */
export const transferFile = async (
  srcAccount,
  destAccount,
  file,
  destFolderId = 'root',
  onProgress = null,
) => {
  if (!srcAccount?.accessToken) throw new Error('Source account has no access token.');
  if (!destAccount?.accessToken) throw new Error('Destination account has no access token.');
  if (srcAccount.email === destAccount.email) throw new Error('Source and destination accounts are the same.');

  const { accessToken: srcToken, email: srcEmail } = srcAccount;
  const { accessToken: destToken, email: destEmail } = destAccount;
  const { id: fileId, name: fileName, mimeType } = file;

  if (isGoogleAppsFile(mimeType)) {
    return _transferGoogleAppsFile(srcToken, destToken, srcEmail, destEmail, fileId, fileName, destFolderId);
  } else {
    return _transferBinaryFile(srcToken, destToken, srcEmail, destEmail, fileId, fileName, mimeType, destFolderId, onProgress);
  }
};

// ── Strategy A: Google Apps files ────────────────────────────

async function _transferGoogleAppsFile(srcToken, destToken, srcEmail, destEmail, fileId, fileName, destFolderId) {
  let permissionId = null;

  try {
    // Step 1: Temporarily grant the destination account read access to the source file
    const permission = await addPermission(srcToken, fileId, destEmail, 'reader', srcEmail);
    permissionId = permission?.id;

    if (!permissionId) {
      throw new Error('Failed to create temporary share permission. The file owner may have disabled sharing.');
    }

    // Step 2: Use destination token to copy the file on Google's servers
    // (Google copies it server-side — zero bytes in browser)
    const copiedFile = await copyFileToDrive(destToken, fileId, fileName, destFolderId, destEmail);

    return copiedFile;
  } finally {
    // Step 3: Always clean up the temporary permission, even if copy failed
    if (permissionId) {
      try {
        await deletePermission(srcToken, fileId, permissionId, srcEmail);
      } catch (cleanupErr) {
        // Non-fatal — the permission will expire; log but don't throw
        console.warn('[DriveUnify] Failed to remove temporary permission:', cleanupErr.message);
      }
    }
  }
}

// ── Strategy B: Binary files ──────────────────────────────────

async function _transferBinaryFile(srcToken, destToken, srcEmail, destEmail, fileId, fileName, mimeType, destFolderId, onProgress) {
  // Step 1: Download blob into browser RAM using source account token
  // (no disk write — stays in memory)
  const blob = await downloadFileBlob(srcToken, fileId, srcEmail);

  // Step 2: Upload to destination drive using multipart upload
  const uploadedFile = await uploadMultipartToDrive(
    destToken,
    blob,
    fileName,
    mimeType,
    destFolderId,
    onProgress,
    destEmail,
  );

  return uploadedFile;
}

// ── Recursive Folder Transfer ─────────────────────────────────

/**
 * Count all files (not folders) recursively under a folder.
 * Used to show deterministic progress in the UI before starting.
 */
export const countFilesInFolder = async (srcAccount, folderId) => {
  const { accessToken, email } = srcAccount;
  const items = await listFolderContents(accessToken, folderId, email);
  const files = items.filter((i) => i.mimeType !== 'application/vnd.google-apps.folder');
  const subfolders = items.filter((i) => i.mimeType === 'application/vnd.google-apps.folder');

  let total = files.length;
  for (const sf of subfolders) {
    total += await countFilesInFolder(srcAccount, sf.id);
  }
  return total;
};

/**
 * Recursively transfer a folder and all its contents from one Drive account to another.
 *
 * @param {object} srcAccount     - { email, accessToken }
 * @param {object} destAccount    - { email, accessToken }
 * @param {object} folder         - { id, name, mimeType } — must be a folder
 * @param {string} destParentId   - destination parent folder ID (default: 'root')
 * @param {function} onProgress   - called after each file: ({ filesDone, currentFile })
 * @param {{ done: number }} counter - shared mutable counter for recursive progress tracking
 * @returns {Promise<object>}     - the created folder object in destination
 */
export const transferFolder = async (
  srcAccount,
  destAccount,
  folder,
  destParentId = 'root',
  onProgress = null,
  counter = { done: 0 },
) => {
  const { accessToken: srcToken, email: srcEmail } = srcAccount;
  const { accessToken: destToken, email: destEmail } = destAccount;

  // Step 1: Create matching folder in destination
  const newFolder = await createFolder(destToken, folder.name, destParentId, destEmail);

  // Step 2: List all direct children of the source folder
  const items = await listFolderContents(srcToken, folder.id, srcEmail);
  const files = items.filter((i) => i.mimeType !== 'application/vnd.google-apps.folder');
  const subfolders = items.filter((i) => i.mimeType === 'application/vnd.google-apps.folder');

  // Step 3: Transfer files (sequential to respect rate limits + show accurate progress)
  for (const file of files) {
    onProgress?.({ filesDone: counter.done, currentFile: file.name, phase: 'copying' });
    try {
      await transferFile(srcAccount, destAccount, file, newFolder.id);
    } catch (err) {
      // Log but continue — one failed file shouldn't abort the whole folder
      console.warn(`[DriveUnify] Failed to transfer "${file.name}":`, err.message);
    }
    counter.done++;
    onProgress?.({ filesDone: counter.done, currentFile: file.name, phase: 'done' });
  }

  // Step 4: Recurse into subfolders
  for (const subfolder of subfolders) {
    onProgress?.({ filesDone: counter.done, currentFile: subfolder.name, phase: 'folder' });
    await transferFolder(srcAccount, destAccount, subfolder, newFolder.id, onProgress, counter);
  }

  return newFolder;
};
