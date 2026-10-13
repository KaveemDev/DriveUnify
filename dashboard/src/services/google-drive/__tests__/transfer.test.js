import { test, it, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  transferFile,
  transferFolder,
  isGoogleAppsFile,
  driveApiAdapter,
} from '../transfer.js';

describe('Google Drive Cross-Account Transfer Service', () => {
  const srcAccount = { email: 'alice@example.com', accessToken: 'src-token-123' };
  const destAccount = { email: 'bob@example.com', accessToken: 'dest-token-456' };

  let originalDriveApi;

  beforeEach(() => {
    // Preserve original API adapter functions
    originalDriveApi = { ...driveApiAdapter };
  });

  afterEach(() => {
    // Restore
    Object.assign(driveApiAdapter, originalDriveApi);
  });

  // ── 1. Authorization & Parameter Validation ─────────────────
  describe('Authorization and Parameter Validation', () => {
    it('should throw if source account has no access token', async () => {
      await assert.rejects(
        () => transferFile({ email: 'alice@example.com' }, destAccount, { id: '1' }),
        /Source account has no access token/
      );
    });

    it('should throw if destination account has no access token', async () => {
      await assert.rejects(
        () => transferFile(srcAccount, { email: 'bob@example.com' }, { id: '1' }),
        /Destination account has no access token/
      );
    });

    it('should throw if source and destination accounts are identical', async () => {
      await assert.rejects(
        () => transferFile(srcAccount, { ...srcAccount }, { id: '1' }),
        /Source and destination accounts are the same/
      );
    });
  });

  // ── 2. Strategy A: Cloud-Side Copying ───────────────────────
  describe('Strategy A: Cloud-Side Copying', () => {
    it('should perform server-side copy for any file when sharing is permitted', async () => {
      let addPermCalled = false;
      let copyCalled = false;
      let deletePermCalled = false;

      driveApiAdapter.addPermission = async (token, fileId, email, role) => {
        addPermCalled = true;
        assert.equal(token, srcAccount.accessToken);
        assert.equal(email, destAccount.email);
        return { id: 'perm-999' };
      };

      driveApiAdapter.copyFileToDrive = async (token, fileId, name, parentId) => {
        copyCalled = true;
        assert.equal(token, destAccount.accessToken);
        assert.equal(fileId, 'file-abc');
        return { id: 'new-file-123', name, parents: [parentId] };
      };

      driveApiAdapter.deletePermission = async (token, fileId, permId) => {
        deletePermCalled = true;
        assert.equal(permId, 'perm-999');
      };

      const file = {
        id: 'file-abc',
        name: 'Report.pdf',
        mimeType: 'application/pdf',
        size: '10485760',
      };

      const result = await transferFile(srcAccount, destAccount, file, 'folder-xyz');

      assert.equal(addPermCalled, true);
      assert.equal(copyCalled, true);
      assert.equal(deletePermCalled, true);
      assert.equal(result.id, 'new-file-123');
      assert.equal(result.transferMode, 'cloud_copy');
    });

    it('should always clean up temporary permission even if copyFileToDrive fails', async () => {
      let deletePermCalled = false;

      driveApiAdapter.addPermission = async () => ({ id: 'perm-clean' });
      driveApiAdapter.copyFileToDrive = async () => {
        throw new Error('Google copy quota exceeded');
      };
      driveApiAdapter.deletePermission = async (token, fileId, permId) => {
        deletePermCalled = true;
        assert.equal(permId, 'perm-clean');
      };

      // Mock streaming fallback to avoid actual network call
      driveApiAdapter.initiateResumableUpload = async () => 'https://upload.url';
      driveApiAdapter.uploadResumableChunk = async () => ({ complete: true, data: { id: 'streamed-file', size: '4' } });
      driveApiAdapter.downloadFileRange = async () => new Blob(['data']);

      const file = { id: 'binary-1', name: 'video.mp4', mimeType: 'video/mp4', size: '4' };
      await transferFile(srcAccount, destAccount, file, 'root');

      assert.equal(deletePermCalled, true);
    });

    it('should reject Google Apps files when cloud copy fails without falling back to stream', async () => {
      driveApiAdapter.addPermission = async () => {
        throw new Error('External sharing disabled by domain policy');
      };

      const file = {
        id: 'doc-1',
        name: 'Project Plan',
        mimeType: 'application/vnd.google-apps.document',
      };

      await assert.rejects(
        () => transferFile(srcAccount, destAccount, file, 'root'),
        /Google Docs\/Sheets cannot be streamed as raw binary/
      );
    });
  });

  // ── 3. Strategy B: Memory-Bounded 8 MiB Streaming ───────────
  describe('Strategy B: Memory-Bounded 8 MiB Resumable Streaming', () => {
    it('should fallback to 8 MiB chunked stream when cloud copy is rejected', async () => {
      // Force cloud copy failure (e.g. sharing disabled)
      driveApiAdapter.addPermission = async () => {
        throw new Error('Sharing is disabled for this file');
      };

      const recordedRanges = [];
      const recordedChunkSizes = [];
      const TOTAL_SIZE = 20 * 1024 * 1024; // 20 MiB file
      const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MiB

      driveApiAdapter.initiateResumableUpload = async (token, meta, mime, totalSize) => {
        assert.equal(totalSize, TOTAL_SIZE);
        return 'https://upload.google.com/session-123';
      };

      driveApiAdapter.downloadFileRange = async (token, fileId, start, end) => {
        recordedRanges.push({ start, end });
        const chunkSize = end - start + 1;
        return new Blob([new Uint8Array(chunkSize)]);
      };

      driveApiAdapter.uploadResumableChunk = async (url, blob, offset, chunkEnd, totalSize) => {
        recordedChunkSizes.push(blob.size);
        assert.ok(blob.size <= CHUNK_SIZE, `Chunk size ${blob.size} exceeded 8 MiB!`);

        if (chunkEnd + 1 >= totalSize) {
          return { complete: true, data: { id: 'uploaded-1', size: String(totalSize) } };
        }
        return { complete: false, status: 308, nextOffset: chunkEnd + 1 };
      };

      const file = {
        id: 'big-file',
        name: 'archive.zip',
        mimeType: 'application/zip',
        size: String(TOTAL_SIZE),
      };

      const result = await transferFile(srcAccount, destAccount, file, 'root');

      assert.equal(result.transferMode, 'stream');
      assert.equal(result.id, 'uploaded-1');

      // 20 MiB file should result in exactly 3 chunks: 8 MiB, 8 MiB, 4 MiB
      assert.equal(recordedRanges.length, 3);
      assert.deepEqual(recordedRanges[0], { start: 0, end: 8 * 1024 * 1024 - 1 });
      assert.deepEqual(recordedRanges[1], { start: 8 * 1024 * 1024, end: 16 * 1024 * 1024 - 1 });
      assert.deepEqual(recordedRanges[2], { start: 16 * 1024 * 1024, end: TOTAL_SIZE - 1 });

      assert.deepEqual(recordedChunkSizes, [
        8 * 1024 * 1024,
        8 * 1024 * 1024,
        4 * 1024 * 1024,
      ]);
    });

    it('should retry transient errors and query resumable upload status', async () => {
      driveApiAdapter.addPermission = async () => {
        throw new Error('Cloud copy disabled');
      };

      const TOTAL_SIZE = 16 * 1024 * 1024;
      let uploadAttempts = 0;
      let statusChecks = 0;

      driveApiAdapter.initiateResumableUpload = async () => 'https://upload.google.com/session-retry';
      driveApiAdapter.downloadFileRange = async (token, id, start, end) => new Blob([new Uint8Array(end - start + 1)]);

      driveApiAdapter.uploadResumableChunk = async (url, blob, offset, chunkEnd) => {
        uploadAttempts++;
        if (uploadAttempts === 2) {
          // Simulate transient 503 error on second chunk
          throw new Error('503 Service Unavailable');
        }
        if (chunkEnd + 1 >= TOTAL_SIZE) {
          return { complete: true, data: { id: 'retry-success', size: String(TOTAL_SIZE) } };
        }
        return { complete: false, status: 308, nextOffset: chunkEnd + 1 };
      };

      driveApiAdapter.getResumableUploadStatus = async () => {
        statusChecks++;
        return { complete: false, nextOffset: 8 * 1024 * 1024 };
      };

      const file = {
        id: 'retry-file',
        name: 'video.mkv',
        mimeType: 'video/x-matroska',
        size: String(TOTAL_SIZE),
      };

      const result = await transferFile(srcAccount, destAccount, file, 'root');
      assert.equal(result.id, 'retry-success');
      assert.ok(statusChecks >= 1, 'Should have queried upload status on error');
    });

    it('should cancel active upload and release session when signal is aborted', async () => {
      driveApiAdapter.addPermission = async () => {
        throw new Error('Cloud copy disabled');
      };

      let cancelCalled = false;
      driveApiAdapter.initiateResumableUpload = async () => 'https://upload.google.com/session-cancel';
      driveApiAdapter.cancelResumableUpload = async (url) => {
        cancelCalled = true;
        assert.equal(url, 'https://upload.google.com/session-cancel');
      };

      const controller = new AbortController();

      driveApiAdapter.downloadFileRange = async () => {
        controller.abort();
        throw new DOMException('Transfer aborted by user', 'AbortError');
      };

      const file = {
        id: 'abort-file',
        name: 'large.iso',
        mimeType: 'application/octet-stream',
        size: '100000000',
      };

      await assert.rejects(
        () => transferFile(srcAccount, destAccount, file, 'root', null, controller.signal),
        /AbortError|aborted/
      );

      assert.equal(cancelCalled, true);
    });

    it('should detect destination file integrity failure when size or MD5 mismatch', async () => {
      driveApiAdapter.addPermission = async () => {
        throw new Error('Cloud copy disabled');
      };

      driveApiAdapter.initiateResumableUpload = async () => 'https://upload.google.com/session-corrupt';
      driveApiAdapter.cancelResumableUpload = async () => {};
      driveApiAdapter.downloadFileRange = async () => new Blob(['1234']);
      driveApiAdapter.uploadResumableChunk = async () => ({
        complete: true,
        data: { id: 'corrupt-1', size: '9999' },
      });

      const file = {
        id: 'integrity-file',
        name: 'secure.dat',
        mimeType: 'application/octet-stream',
        size: '1234',
        md5Checksum: 'expected-md5-hash',
      };

      await assert.rejects(
        () => transferFile(srcAccount, destAccount, file, 'root'),
        /File integrity check failed: expected 1234 bytes/
      );
    });
  });

  // ── 4. Recursive Folder Transfer ────────────────────────────
  describe('Recursive Folder Transfer', () => {
    it('should transfer folder contents sequentially with concurrency of 1', async () => {
      driveApiAdapter.createFolder = async (token, name) => ({ id: `new-folder-${name}`, name });
      driveApiAdapter.listFolderContents = async () => [
        { id: 'f1', name: 'File1.txt', mimeType: 'text/plain', size: '100' },
        { id: 'f2', name: 'File2.txt', mimeType: 'text/plain', size: '200' },
      ];

      const transferredFiles = [];
      driveApiAdapter.addPermission = async () => ({ id: 'p' });
      driveApiAdapter.deletePermission = async () => {};
      driveApiAdapter.copyFileToDrive = async (token, fileId, name) => {
        transferredFiles.push(name);
        return { id: `copied-${name}`, name };
      };

      const folder = { id: 'folder-1', name: 'MyDocuments', mimeType: 'application/vnd.google-apps.folder' };
      const res = await transferFolder(srcAccount, destAccount, folder);

      assert.equal(res.id, 'new-folder-MyDocuments');
      assert.deepEqual(transferredFiles, ['File1.txt', 'File2.txt']);
    });
  });
});
