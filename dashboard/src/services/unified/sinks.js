/**
 * unified/sinks.js
 *
 * Download destinations for reconstructed files.
 *  - Chromium (Chrome/Edge/Opera): File System Access API streams each verified chunk straight to disk,
 *    so memory stays bounded for any file size. abort() discards the partial file.
 *  - Other browsers: no standard streaming-to-disk API, so we fall back to an in-memory Blob,
 *    capped at BLOB_FALLBACK_LIMIT. Larger files are refused with an explanation.
 */

import { UnifiedError, ERR, sanitizeFilename } from './core.js';

export const BLOB_FALLBACK_LIMIT = 512 * 1024 * 1024;

export const canStreamToDisk = () => typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';

/** Call directly from a click handler: the save picker needs a user gesture. */
export const createDownloadSink = async ({ name, size, mimeType }) => {
  const suggestedName = sanitizeFilename(name);
  if (canStreamToDisk()) {
    const handle = await window.showSaveFilePicker({ suggestedName });
    const writable = await handle.createWritable();
    return {
      write: (bytes) => writable.write(bytes),
      close: () => writable.close(),
      abort: () => writable.abort(),
    };
  }
  if (size > BLOB_FALLBACK_LIMIT) {
    throw new UnifiedError(
      ERR.UNSUPPORTED,
      'This browser cannot stream large downloads to disk. Use a recent Chrome or Edge to download files over 512 MB.',
    );
  }
  let parts = [];
  return {
    write: async (bytes) => { parts.push(bytes); },
    close: async () => {
      const url = URL.createObjectURL(new Blob(parts, { type: mimeType || 'application/octet-stream' }));
      parts = [];
      const a = document.createElement('a');
      a.href = url;
      a.download = suggestedName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    abort: async () => { parts = []; },
  };
};
