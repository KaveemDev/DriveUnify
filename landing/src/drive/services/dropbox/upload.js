/**
 * services/dropbox/upload.js
 *
 * Handles file uploads to Dropbox with chunked upload sessions for files > 4 MiB.
 */

import {
  uploadDropboxFileDirect,
  initiateDropboxUploadSession,
  appendDropboxUploadChunk,
  finishDropboxUploadSession,
  resolveDropboxPath,
  normalizeDropboxFile,
} from '../../api/dropboxApi';
import { TRANSFER_CHUNK_SIZE } from '../../config/constants';

const CHUNK_SIZE = TRANSFER_CHUNK_SIZE || 8 * 1024 * 1024;

export const uploadDropboxFile = async (accessToken, file, options = {}) => {
  const { folderId = 'root', accountEmail = '', signal = null, onProgress = null } = options;
  const fileName = file.name;
  const totalSize = file.size;
  const targetPath = resolveDropboxPath(folderId, fileName);

  if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError');

  // Small file: Single request
  if (totalSize <= 4 * 1024 * 1024) {
    onProgress?.(10);
    const result = await uploadDropboxFileDirect(accessToken, file, targetPath, signal);
    onProgress?.(100);
    return normalizeDropboxFile(result, accountEmail);
  }

  // Large file: Resumable chunked upload session
  let offset = 0;
  const firstSlice = file.slice(0, Math.min(CHUNK_SIZE, totalSize));
  const sessionId = await initiateDropboxUploadSession(accessToken, firstSlice, signal);
  offset += firstSlice.size;

  onProgress?.(Math.round((offset / totalSize) * 100));

  while (offset < totalSize) {
    if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError');

    const nextEnd = Math.min(offset + CHUNK_SIZE, totalSize);
    const isLast = nextEnd >= totalSize;
    const chunk = file.slice(offset, nextEnd);

    if (isLast) {
      const finishResult = await finishDropboxUploadSession(
        accessToken,
        sessionId,
        chunk,
        totalSize,
        targetPath,
        signal
      );
      onProgress?.(100);
      return normalizeDropboxFile(finishResult, accountEmail);
    } else {
      await appendDropboxUploadChunk(accessToken, sessionId, chunk, offset, signal);
      offset += chunk.size;
      onProgress?.(Math.round((offset / totalSize) * 100));
    }
  }

  // Edge case: Finished exact multiple of chunk size
  const finalResult = await finishDropboxUploadSession(
    accessToken,
    sessionId,
    new Blob([]),
    totalSize,
    targetPath,
    signal
  );
  onProgress?.(100);
  return normalizeDropboxFile(finalResult, accountEmail);
};
