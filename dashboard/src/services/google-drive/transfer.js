/**
 * transfer.js
 *
 * Orchestrates cross-account Google Drive file transfers.
 *
 * Primary Strategy (Zero-Byte Cloud-Side Copy):
 *   1. Temporarily grants destination account 'reader' access on source file.
 *   2. Invokes Google Drive API files.copy with destination token.
 *   3. Google copies file directly between accounts on their infrastructure.
 *   4. Instantly revokes temporary permission in finally block.
 *   → 0 bytes downloaded to browser. Instant transfer, zero bandwidth used.
 *
 * Fallback Strategy (Bounded 8 MiB Resumable Browser Stream):
 *   Used when cloud-side copy is restricted by provider policies (e.g. sharing disabled,
 *   cross-domain organization restrictions, or viewer copy disallowed):
 *   1. Initiates Google Drive resumable upload session on destination.
 *   2. Streams file in strictly bounded 8 MiB chunks using HTTP Range requests.
 *   3. Uploads each 8 MiB chunk and releases buffer immediately to the garbage collector.
 *   4. Supports AbortSignal for instant user cancellation and session cleanup.
 *   5. Automatically resumes from last accepted byte on transient network errors.
 *   6. Verifies file size and MD5 checksum integrity upon completion.
 *   → Peak memory is strictly bounded to ~8–12 MiB regardless of file size.
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
} from '../../api/googleDriveApi.js';
import { TRANSFER_CHUNK_SIZE } from '../../config/constants.js';

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
 * Transfer a file from one Google Drive account to another.
 *
 * @param {object} srcAccount   - { email, accessToken }
 * @param {object} destAccount  - { email, accessToken }
 * @param {object} file         - normalized file object from Drive store
 * @param {string} destFolderId - destination folder ID (default: 'root')
 * @param {function} onProgress - optional (0-100) progress callback
 * @param {AbortSignal} signal  - optional AbortSignal for user cancellation
 * @returns {Promise<object>}   - created file object in destination Drive
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
  if (srcAccount.email === destAccount.email) throw new Error('Source and destination accounts are the same.');
  if (signal?.aborted) throw new DOMException('Transfer aborted', 'AbortError');

  const { accessToken: srcToken, email: srcEmail } = srcAccount;
  const { accessToken: destToken, email: destEmail } = destAccount;
  const { id: fileId, name: fileName, mimeType } = file;

  // ── Strategy A: Attempt Cloud-Side Copy First ─────────────────
  // Works across accounts for all files when sharing is permitted by Google Drive policies.
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

    // Google Workspace files (Docs/Sheets) cannot be streamed via raw media download
    if (isGoogleAppsFile(mimeType)) {
      throw new Error(
        `Cloud-side copy failed for "${fileName}": ${copyErr.message}. Google Docs/Sheets cannot be streamed as raw binary.`
      );
    }

    // For all binary files (PDF, MP4, ZIP, etc.), gracefully fallback to bounded 8 MiB streaming
    console.info(
      `[DriveUnify] Cloud-side copy rejected for "${fileName}" (${copyErr.message}). Falling back to memory-safe 8 MiB streaming.`
    );

    return await _transferViaBoundedStream(
      srcToken,
      destToken,
      srcEmail,
      destEmail,
      file,
      destFolderId,
      onProgress,
      signal
    );
  }
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
 * Strategy B: Memory-bounded (8 MiB chunks) browser-based transfer with resumable upload,
 * Range requests, automatic retry, and integrity validation.
 */
async function _transferViaBoundedStream(
  srcToken,
  destToken,
  srcEmail,
  destEmail,
  file,
  destFolderId,
  onProgress = null,
  signal = null
) {
  const { id: fileId, name: fileName, mimeType, md5Checksum: srcMd5 } = file;
  const totalSize = file.size ? parseInt(file.size, 10) : 0;
  const throttledProgress = createThrottledProgress(onProgress);

  throttledProgress(0, { mode: 'stream', current: 0, total: totalSize });

  // Step 1: Initiate Google Drive resumable upload session on destination
  let uploadUrl = null;
  try {
    uploadUrl = await driveApiAdapter.initiateResumableUpload(
      destToken,
      { name: fileName, parents: [destFolderId] },
      mimeType,
      totalSize,
      signal,
      destEmail
    );
  } catch (initErr) {
    throw new Error(`Failed to initiate destination upload: ${initErr.message}`);
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

  // Step 2: Stream file in bounded 8 MiB chunks using HTTP Range requests
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
          // Download only this 8 MiB slice from source
          const chunkBlob = await driveApiAdapter.downloadFileRange(srcToken, fileId, offset, chunkEnd, signal, srcEmail);

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

          // Emit throttled progress update
          const pct = Math.min(100, Math.round((offset / totalSize) * 100));
          throttledProgress(pct, { mode: 'stream', current: offset, total: totalSize });
        } catch (chunkErr) {
          if (signal?.aborted) throw chunkErr;

          retries++;
          if (retries > MAX_RETRIES) {
            throw new Error(`Transfer failed on chunk at offset ${offset}: ${chunkErr.message}`);
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
            // If status check fails, retry current offset
          }
        }
      }
    }

    // Step 3: If not completed in loop, do final status check
    if (!completedFile) {
      const finalStatus = await driveApiAdapter.getResumableUploadStatus(uploadUrl, totalSize, signal);
      if (finalStatus.complete) {
        completedFile = finalStatus.data;
      } else {
        throw new Error('Resumable upload ended before receiving all bytes.');
      }
    }

    // Step 4: Verify destination file size and integrity
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
    // Clean up upload session if cancelled or failed
    await driveApiAdapter.cancelResumableUpload(uploadUrl);
    throw err;
  }
}

// ── Recursive Folder Transfer ─────────────────────────────────

/**
 * Count all files (not folders) recursively under a folder.
 */
export const countFilesInFolder = async (srcAccount, folderId) => {
  const { accessToken, email } = srcAccount;
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
 * Recursively transfer a folder and all its contents from one Drive account to another.
 * Limits concurrency strictly to one file at a time to prevent CPU / memory thrashing.
 *
 * @param {object} srcAccount     - { email, accessToken }
 * @param {object} destAccount    - { email, accessToken }
 * @param {object} folder         - { id, name, mimeType }
 * @param {string} destParentId   - destination parent folder ID (default: 'root')
 * @param {function} onProgress   - called after each step
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

  const { accessToken: srcToken, email: srcEmail } = srcAccount;
  const { accessToken: destToken, email: destEmail } = destAccount;

  // Step 1: Create matching folder in destination
  const newFolder = await driveApiAdapter.createFolder(destToken, folder.name, destParentId, destEmail);

  // Step 2: List direct children of source folder
  const items = await driveApiAdapter.listFolderContents(srcToken, folder.id, srcEmail);
  const files = items.filter((i) => i.mimeType !== 'application/vnd.google-apps.folder');
  const subfolders = items.filter((i) => i.mimeType === 'application/vnd.google-apps.folder');

  // Step 3: Transfer files sequentially (strict concurrency: 1)
  for (const file of files) {
    if (signal?.aborted) throw new DOMException('Folder transfer aborted by user', 'AbortError');

    onProgress?.({ filesDone: counter.done, currentFile: file.name, phase: 'copying' });
    try {
      await transferFile(srcAccount, destAccount, file, newFolder.id, null, signal);
    } catch (err) {
      if (signal?.aborted) throw err;
      console.warn(`[DriveUnify] Failed to transfer "${file.name}":`, err.message);
    }
    counter.done++;
    onProgress?.({ filesDone: counter.done, currentFile: file.name, phase: 'done' });
  }

  // Step 4: Recurse into subfolders sequentially
  for (const subfolder of subfolders) {
    if (signal?.aborted) throw new DOMException('Folder transfer aborted by user', 'AbortError');

    onProgress?.({ filesDone: counter.done, currentFile: subfolder.name, phase: 'folder' });
    await transferFolder(srcAccount, destAccount, subfolder, newFolder.id, onProgress, counter, signal);
  }

  return newFolder;
};
