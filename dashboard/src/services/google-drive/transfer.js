/**
 * transfer.js
 *
 * Orchestrates cross-account file transfers between Google Drive and Dropbox.
 *
 * Primary Strategy (Method 1: Zero-Byte Cloud-Side Copy):
 *   - Used when both source and destination are Google Drive accounts.
 *   - Google copies file directly between accounts on their infrastructure.
 *   - 0 bytes downloaded to browser. Instant transfer, zero bandwidth used.
 *
 * Fallback Strategy & Cross-Cloud Transfer (Method 2: Bounded 8 MiB Browser Stream):
 *   - Used when copying between Google Drive and Dropbox, between Dropbox accounts,
 *     or when Google Drive cloud-side copy is restricted by provider policies.
 *   - Strictly streams data in bounded 8 MiB chunks using HTTP Range requests.
 *   - Uploads each 8 MiB chunk and releases buffer immediately to the garbage collector.
 *   - Supports AbortSignal for instant user cancellation and session cleanup.
 *   - Automatically resumes from last accepted byte on transient network errors.
 *   - Peak memory is strictly bounded to ~8–12 MiB regardless of file size.
 */

import {
  addPermission,
  deletePermission,
  copyFileToDrive,
  downloadFileRange,
  initiateResumableUpload,
  uploadResumableChunk,
  getResumableUploadStatus,
  cancelResumableUpload,
  listFolderContents,
  createFolder,
  exportGoogleFile,
} from '../../api/googleDriveApi.js';

import {
  downloadDropboxFileRange,
  initiateDropboxUploadSession,
  appendDropboxUploadChunk,
  finishDropboxUploadSession,
  uploadDropboxFileDirect,
  listDropboxFiles,
  createDropboxFolder,
  listDropboxFolders,
  resolveDropboxPath,
  normalizeDropboxFile,
} from '../../api/dropboxApi.js';

import { TRANSFER_CHUNK_SIZE } from '../../config/constants.js';
import { getAccountId } from '../../utils/helpers.js';

// Google Apps mime types that do not have a raw binary media stream (must use files.copy)
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

export const isGoogleAppsFile = (mimeType) => GOOGLE_APPS_MIME_TYPES.has(mimeType);

// Google-native files have no bytes to stream, so they are exported to these formats instead
const GOOGLE_EXPORT_FORMATS = {
  'application/vnd.google-apps.document': { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' },
  'application/vnd.google-apps.spreadsheet': { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx' },
  'application/vnd.google-apps.presentation': { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: 'pptx' },
  'application/vnd.google-apps.drawing': { mime: 'application/pdf', ext: 'pdf' },
};

/**
 * Drive API adapter object to facilitate clean testing and dependency injection.
 */
export const driveApiAdapter = {
  addPermission,
  deletePermission,
  copyFileToDrive,
  downloadFileRange,
  initiateResumableUpload,
  uploadResumableChunk,
  getResumableUploadStatus,
  cancelResumableUpload,
  listFolderContents,
  createFolder,
  exportGoogleFile,
};

/**
 * Dropbox API adapter object to facilitate clean testing and dependency injection.
 */
export const dropboxApiAdapter = {
  downloadDropboxFileRange,
  initiateDropboxUploadSession,
  appendDropboxUploadChunk,
  finishDropboxUploadSession,
  uploadDropboxFileDirect,
  listDropboxFiles,
  createDropboxFolder,
  listDropboxFolders,
};

/**
 * Creates a throttled progress callback to protect the UI thread.
 * Emits at most once every intervalMs unless pct is 100 or 0.
 */
const createThrottledProgress = (onProgress, intervalMs = 150) => {
  if (!onProgress) return () => {};
  let lastTime = 0;
  let lastPct = -1;

  return (pct, meta = {}) => {
    const now = Date.now();
    if (pct === 100 || pct === 0 || (pct !== lastPct && now - lastTime >= intervalMs)) {
      lastTime = now;
      lastPct = pct;
      onProgress(pct, meta);
    }
  };
};

/**
 * Sleep helper for exponential backoff retries.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to determine if an account belongs to Dropbox.
 */
const isDropboxAccount = (account) => (account?.provider || '').toLowerCase().includes('dropbox');

/**
 * Transfer a file across connected storage accounts (Google Drive <-> Dropbox <-> Google Drive).
 *
 * @param {object} srcAccount   - { email, accessToken, provider }
 * @param {object} destAccount  - { email, accessToken, provider }
 * @param {object} file         - normalized file object from Drive/Dropbox store
 * @param {string} destFolderId - destination folder ID or path (default: 'root')
 * @param {function} onProgress - optional (0-100) progress callback
 * @param {AbortSignal} signal  - optional AbortSignal for user cancellation
 * @returns {Promise<object>}   - created file object in destination account
 */
export const transferFile = async (
  srcAccount,
  destAccount,
  file,
  destFolderId = 'root',
  onProgress = null,
  signal = null,
) => {
  if (!srcAccount?.accessToken) throw new Error('Source account has no access token.');
  if (!destAccount?.accessToken) throw new Error('Destination account has no access token.');
  if (getAccountId(srcAccount) === getAccountId(destAccount)) throw new Error('Source and destination accounts are the same.');
  if (signal?.aborted) throw new DOMException('Transfer aborted', 'AbortError');

  const srcIsDropbox = isDropboxAccount(srcAccount);
  const destIsDropbox = isDropboxAccount(destAccount);
  const isCrossProvider = srcIsDropbox || destIsDropbox;

  const { accessToken: srcToken, email: srcEmail } = srcAccount;
  const { accessToken: destToken, email: destEmail } = destAccount;
  const { id: fileId, name: fileName, mimeType } = file;

  // ── Strategy A (Method 1): Cloud-Side Copy (Google Drive-to-Google Drive only) ──
  // Cannot be used when either source or destination is Dropbox ("2nd method as 1st method wont work here")
  if (!isCrossProvider) {
    try {
      return await _transferViaCloudCopy(
        srcToken,
        destToken,
        srcEmail,
        destEmail,
        fileId,
        fileName,
        destFolderId,
        signal
      );
    } catch (copyErr) {
      if (signal?.aborted) throw copyErr;

      console.info(
        `[DriveUnify] Cloud-side copy rejected for "${fileName}" (${copyErr.message}). Falling back to browser transfer.`
      );
    }
  }

  // Google Docs/Sheets/Slides have no raw bytes: export them, then upload the export
  if (!srcIsDropbox && isGoogleAppsFile(mimeType)) {
    return await _transferViaExport(srcAccount, destAccount, file, destFolderId, onProgress, signal);
  }

  // ── Strategy B (Method 2): Memory-Bounded 8 MiB Streaming Transfer ──
  return await _transferViaBoundedStream(
    srcAccount,
    destAccount,
    file,
    destFolderId,
    onProgress,
    signal
  );
};

/**
 * Strategy A: Server-side duplication directly on Google servers (zero bytes through browser).
 */
async function _transferViaCloudCopy(
  srcToken,
  destToken,
  srcEmail,
  destEmail,
  fileId,
  fileName,
  destFolderId,
  signal = null
) {
  let permissionId = null;

  try {
    if (signal?.aborted) throw new DOMException('Transfer aborted', 'AbortError');

    // 1. Temporarily share source file with destination account (reader role)
    const permission = await driveApiAdapter.addPermission(srcToken, fileId, destEmail, 'reader', srcEmail);
    permissionId = permission?.id;

    if (!permissionId) {
      throw new Error('Failed to create temporary share permission. Sharing may be disabled for this file.');
    }

    if (signal?.aborted) throw new DOMException('Transfer aborted', 'AbortError');

    // 2. Google copies the file on their infrastructure using destination credentials
    const copiedFile = await driveApiAdapter.copyFileToDrive(destToken, fileId, fileName, destFolderId, destEmail);

    return { ...copiedFile, transferMode: 'cloud_copy' };
  } finally {
    // 3. Always clean up temporary permission, even if copy failed
    if (permissionId) {
      try {
        await driveApiAdapter.deletePermission(srcToken, fileId, permissionId, srcEmail);
      } catch (cleanupErr) {
        console.warn('[DriveUnify] Failed to remove temporary share permission:', cleanupErr.message);
      }
    }
  }
}

/**
 * Google-native files: export to Office/PDF, then upload. Drive destinations
 * convert the upload back into a native Google file.
 */
async function _transferViaExport(srcAccount, destAccount, file, destFolderId, onProgress = null, signal = null) {
  const format = GOOGLE_EXPORT_FORMATS[file.mimeType];
  if (!format) {
    throw new Error(`"${file.name}" is a Google file type that can't be exported, so it can only be copied between Google Drive accounts.`);
  }
  const progress = createThrottledProgress(onProgress);
  progress(0, { mode: 'export' });

  const blob = await driveApiAdapter.exportGoogleFile(srcAccount.accessToken, file.id, format.mime, signal, srcAccount.email);
  progress(50, { mode: 'export' });

  if (isDropboxAccount(destAccount)) {
    const name = file.name.toLowerCase().endsWith(`.${format.ext}`) ? file.name : `${file.name}.${format.ext}`;
    const res = await dropboxApiAdapter.uploadDropboxFileDirect(destAccount.accessToken, blob, resolveDropboxPath(destFolderId, name), signal);
    progress(100, { mode: 'export' });
    return { ...(res || {}), transferMode: 'export' };
  }

  // Setting the Google mime type in metadata makes Drive convert the Office file back
  const uploadUrl = await driveApiAdapter.initiateResumableUpload(
    destAccount.accessToken,
    { name: file.name, mimeType: file.mimeType, parents: [destFolderId === '' ? 'root' : destFolderId] },
    format.mime,
    blob.size,
    signal,
    destAccount.email
  );
  try {
    const result = await driveApiAdapter.uploadResumableChunk(uploadUrl, blob, 0, blob.size - 1, blob.size, signal);
    if (!result.complete) throw new Error('Upload of exported file did not complete.');
    progress(100, { mode: 'export' });
    return { ...(result.data || {}), transferMode: 'export' };
  } catch (err) {
    await driveApiAdapter.cancelResumableUpload(uploadUrl);
    throw err;
  }
}

/**
 * Strategy B (Method 2): Memory-bounded (8 MiB chunks) browser streaming transfer.
 * Compatible with Google Drive <-> Google Drive, Google Drive <-> Dropbox, and Dropbox <-> Dropbox.
 */
async function _transferViaBoundedStream(
  srcAccount,
  destAccount,
  file,
  destFolderId,
  onProgress = null,
  signal = null
) {
  const { id: fileId, name: fileName, mimeType, md5Checksum: srcMd5 } = file;
  const srcToken = srcAccount.accessToken;
  const destToken = destAccount.accessToken;
  const srcEmail = srcAccount.email;
  const destEmail = destAccount.email;

  const srcIsDropbox = isDropboxAccount(srcAccount);
  const destIsDropbox = isDropboxAccount(destAccount);

  const totalSize = file.size ? parseInt(file.size, 10) : 0;
  const throttledProgress = createThrottledProgress(onProgress);

  throttledProgress(0, { mode: 'stream', current: 0, total: totalSize });

  // ── Source download slice reader ──
  const readSourceChunk = async (start, end) => {
    if (srcIsDropbox) {
      return await dropboxApiAdapter.downloadDropboxFileRange(
        srcToken,
        file.pathLower || fileId,
        start,
        end,
        signal
      );
    }
    return await driveApiAdapter.downloadFileRange(
      srcToken,
      fileId,
      start,
      end,
      signal,
      srcEmail
    );
  };

  // ── Destination Writer: Handle Dropbox Destination ──
  if (destIsDropbox) {
    const targetPath = resolveDropboxPath(destFolderId, fileName);

    // Empty file edge case
    if (totalSize === 0) {
      const res = await dropboxApiAdapter.uploadDropboxFileDirect(
        destToken,
        new Blob([]),
        targetPath,
        signal
      );
      throttledProgress(100, { mode: 'stream', current: 0, total: 0 });
      return { ...(res || {}), transferMode: 'stream' };
    }

    const CHUNK_SIZE = TRANSFER_CHUNK_SIZE;
    let offset = 0;
    let sessionId = null;
    let completedFile = null;

    while (offset < totalSize) {
      if (signal?.aborted) throw new DOMException('Transfer aborted by user', 'AbortError');

      const chunkEnd = Math.min(offset + CHUNK_SIZE, totalSize) - 1;
      const isFirstChunk = offset === 0;
      const isFinalChunk = chunkEnd + 1 >= totalSize;

      let chunkSuccess = false;
      let retries = 0;
      const MAX_RETRIES = 3;

      while (!chunkSuccess && retries <= MAX_RETRIES) {
        if (signal?.aborted) throw new DOMException('Transfer aborted by user', 'AbortError');

        try {
          const chunkBlob = await readSourceChunk(offset, chunkEnd);

          if (isFirstChunk && isFinalChunk) {
            // Fits in single direct upload
            completedFile = await dropboxApiAdapter.uploadDropboxFileDirect(
              destToken,
              chunkBlob,
              targetPath,
              signal
            );
          } else if (isFirstChunk) {
            sessionId = await dropboxApiAdapter.initiateDropboxUploadSession(
              destToken,
              chunkBlob,
              signal
            );
          } else if (isFinalChunk) {
            completedFile = await dropboxApiAdapter.finishDropboxUploadSession(
              destToken,
              sessionId,
              chunkBlob,
              totalSize,
              targetPath,
              signal
            );
          } else {
            await dropboxApiAdapter.appendDropboxUploadChunk(
              destToken,
              sessionId,
              chunkBlob,
              offset,
              signal
            );
          }

          offset = chunkEnd + 1;
          chunkSuccess = true;
          const pct = Math.min(100, Math.round((offset / totalSize) * 100));
          throttledProgress(pct, { mode: 'stream', current: offset, total: totalSize });
        } catch (chunkErr) {
          if (signal?.aborted) throw chunkErr;
          retries++;
          if (retries > MAX_RETRIES) {
            throw new Error(`Dropbox upload failed on chunk at offset ${offset}: ${chunkErr.message}`, {
              cause: chunkErr,
            });
          }
          await sleep(Math.pow(2, retries) * 1000 + Math.random() * 500);
        }
      }
    }

    throttledProgress(100, { mode: 'stream', current: totalSize, total: totalSize });
    return { ...(completedFile || {}), transferMode: 'stream' };
  }

  // ── Destination Writer: Handle Google Drive Destination ──
  let uploadUrl;
  try {
    uploadUrl = await driveApiAdapter.initiateResumableUpload(
      destToken,
      { name: fileName, parents: [destFolderId === '' ? 'root' : destFolderId] },
      mimeType,
      totalSize,
      signal,
      destEmail
    );
  } catch (initErr) {
    throw new Error(`Failed to initiate destination upload: ${initErr.message}`, { cause: initErr });
  }

  // Handle empty file edge case
  if (totalSize === 0) {
    try {
      const emptyChunk = new Blob([]);
      const result = await driveApiAdapter.uploadResumableChunk(uploadUrl, emptyChunk, 0, 0, 0, signal);
      throttledProgress(100, { mode: 'stream', current: 0, total: 0 });
      return { ...(result.data || {}), transferMode: 'stream' };
    } catch (emptyErr) {
      await driveApiAdapter.cancelResumableUpload(uploadUrl);
      throw emptyErr;
    }
  }

  // Stream file in bounded 8 MiB chunks using HTTP Range requests
  const CHUNK_SIZE = TRANSFER_CHUNK_SIZE;
  let offset = 0;
  let completedFile = null;

  try {
    while (offset < totalSize) {
      if (signal?.aborted) throw new DOMException('Transfer aborted by user', 'AbortError');

      const chunkEnd = Math.min(offset + CHUNK_SIZE, totalSize) - 1;
      let chunkSuccess = false;
      let retries = 0;
      const MAX_RETRIES = 4;

      while (!chunkSuccess && retries <= MAX_RETRIES) {
        if (signal?.aborted) throw new DOMException('Transfer aborted by user', 'AbortError');

        try {
          // Download bounded 8 MiB slice from source
          const chunkBlob = await readSourceChunk(offset, chunkEnd);

          // Upload the 8 MiB slice to destination resumable session
          const result = await driveApiAdapter.uploadResumableChunk(uploadUrl, chunkBlob, offset, chunkEnd, totalSize, signal);

          if (result.complete) {
            completedFile = result.data;
            offset = totalSize;
            chunkSuccess = true;
          } else if (result.status === 308) {
            offset = result.nextOffset;
            chunkSuccess = true;
          } else {
            throw new Error(`Unexpected resumable upload response: ${result.status}`);
          }

          const pct = Math.min(100, Math.round((offset / totalSize) * 100));
          throttledProgress(pct, { mode: 'stream', current: offset, total: totalSize });
        } catch (chunkErr) {
          if (signal?.aborted) throw chunkErr;

          retries++;
          if (retries > MAX_RETRIES) {
            throw new Error(`Transfer failed on chunk at offset ${offset}: ${chunkErr.message}`, {
              cause: chunkErr,
            });
          }

          // Check upload status with Google Drive to resync offset before retry
          await sleep(Math.pow(2, retries) * 1000 + Math.random() * 500);
          try {
            const status = await driveApiAdapter.getResumableUploadStatus(uploadUrl, totalSize, signal);
            if (status.complete) {
              completedFile = status.data;
              offset = totalSize;
              chunkSuccess = true;
            } else {
              offset = status.nextOffset;
            }
          } catch {
            // Retry current offset
          }
        }
      }
    }

    if (!completedFile) {
      const finalStatus = await driveApiAdapter.getResumableUploadStatus(uploadUrl, totalSize, signal);
      if (finalStatus.complete) {
        completedFile = finalStatus.data;
      } else {
        throw new Error('Resumable upload ended before receiving all bytes.');
      }
    }

    // Verify destination file size and integrity
    if (completedFile.size && parseInt(completedFile.size, 10) !== totalSize) {
      throw new Error(
        `File integrity check failed: expected ${totalSize} bytes, but destination has ${completedFile.size} bytes.`
      );
    }

    if (srcMd5 && completedFile.md5Checksum && completedFile.md5Checksum !== srcMd5) {
      throw new Error(
        `File integrity check failed: MD5 mismatch (source: ${srcMd5}, destination: ${completedFile.md5Checksum}).`
      );
    }

    throttledProgress(100, { mode: 'stream', current: totalSize, total: totalSize });
    return { ...completedFile, transferMode: 'stream' };
  } catch (err) {
    await driveApiAdapter.cancelResumableUpload(uploadUrl);
    throw err;
  }
}

// ── Recursive Folder Transfer ─────────────────────────────────

/**
 * Count all files (not folders) recursively under a folder across providers.
 */
export const countFilesInFolder = async (srcAccount, folderId) => {
  const { accessToken, email } = srcAccount;
  const srcIsDropbox = isDropboxAccount(srcAccount);

  if (srcIsDropbox) {
    const items = await dropboxApiAdapter.listDropboxFiles(accessToken, folderId, { recursive: true });
    return items.filter((i) => i['.tag'] === 'file').length;
  }

  const items = await driveApiAdapter.listFolderContents(accessToken, folderId, email);
  const files = items.filter((i) => i.mimeType !== 'application/vnd.google-apps.folder');
  const subfolders = items.filter((i) => i.mimeType === 'application/vnd.google-apps.folder');

  let total = files.length;
  for (const sf of subfolders) {
    total += await countFilesInFolder(srcAccount, sf.id);
  }
  return total;
};

/**
 * Recursively transfer a folder and all its contents across cloud storage accounts.
 *
 * @param {object} srcAccount     - { email, accessToken, provider }
 * @param {object} destAccount    - { email, accessToken, provider }
 * @param {object} folder         - { id, name, mimeType, pathLower }
 * @param {string} destParentId   - destination parent folder ID or path
 * @param {function} onProgress   - called after each file
 * @param {{ done: number, total: number }} counter - progress counter
 * @param {AbortSignal} signal    - AbortSignal for user cancellation
 * @returns {Promise<object>}     - created folder object in destination
 */
export const transferFolder = async (
  srcAccount,
  destAccount,
  folder,
  destParentId = 'root',
  onProgress = null,
  counter = { done: 0, total: 0 },
  signal = null
) => {
  if (signal?.aborted) throw new DOMException('Folder transfer aborted by user', 'AbortError');

  const srcIsDropbox = isDropboxAccount(srcAccount);
  const destIsDropbox = isDropboxAccount(destAccount);

  let newFolderId;
  let newFolder;

  // 1. Create matching folder on destination
  if (destIsDropbox) {
    const targetPath = resolveDropboxPath(destParentId, folder.name);
    newFolder = await dropboxApiAdapter.createDropboxFolder(destAccount.accessToken, targetPath);
    newFolderId = targetPath;
  } else {
    newFolder = await driveApiAdapter.createFolder(
      destAccount.accessToken,
      folder.name,
      destParentId,
      destAccount.email
    );
    newFolderId = newFolder.id;
  }

  // 2. Fetch children in source folder
  let files;
  let subfolders;

  if (srcIsDropbox) {
    const items = await dropboxApiAdapter.listDropboxFiles(srcAccount.accessToken, folder.pathLower || folder.id, {
      recursive: false,
    });
    files = items
      .filter((i) => i['.tag'] === 'file')
      .map((entry) => normalizeDropboxFile(entry, srcAccount.email));
    subfolders = items
      .filter((i) => i['.tag'] === 'folder')
      .map((entry) => normalizeDropboxFile(entry, srcAccount.email));
  } else {
    const items = await driveApiAdapter.listFolderContents(srcAccount.accessToken, folder.id, srcAccount.email);
    files = items.filter((i) => i.mimeType !== 'application/vnd.google-apps.folder');
    subfolders = items.filter((i) => i.mimeType === 'application/vnd.google-apps.folder');
  }

  // 3. Sequentially transfer all files
  for (const file of files) {
    if (signal?.aborted) throw new DOMException('Folder transfer aborted by user', 'AbortError');

    try {
      await transferFile(srcAccount, destAccount, file, newFolderId, null, signal);
      counter.done += 1;
      onProgress?.({ filesDone: counter.done, total: counter.total, currentFile: file.name });
    } catch (err) {
      console.warn(`[DriveUnify] Failed to transfer "${file.name}":`, err.message);
    }
  }

  // 4. Recursively transfer all subfolders
  for (const subfolder of subfolders) {
    if (signal?.aborted) throw new DOMException('Folder transfer aborted by user', 'AbortError');

    await transferFolder(srcAccount, destAccount, subfolder, newFolderId, onProgress, counter, signal);
  }

  return newFolder;
};
