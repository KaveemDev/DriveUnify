import { it, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  transferFile,
  transferFolder,
  driveApiAdapter,
  dropboxApiAdapter,
} from '../transfer.js';

describe('Google Drive Cross-Account Transfer Service', () => {
  const srcAccount = { email: 'alice@example.com', accessToken: 'src-token-123' };
  const destAccount = { email: 'bob@example.com', accessToken: 'dest-token-456' };

  let originalDriveApi;
  let originalDropboxApi;

  beforeEach(() => {
    // Preserve original API adapter functions
    originalDriveApi = { ...driveApiAdapter };
    originalDropboxApi = { ...dropboxApiAdapter };
  });

  afterEach(() => {
    // Restore
    Object.assign(driveApiAdapter, originalDriveApi);
    Object.assign(dropboxApiAdapter, originalDropboxApi);
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

      driveApiAdapter.addPermission = async (token, fileId, email, _role) => {
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

    it('should export a Google Doc and upload it as a native Doc when cloud copy fails', async () => {
      driveApiAdapter.addPermission = async () => {
        throw new Error('External sharing disabled by domain policy');
      };
      let exportedAs;
      let uploadMeta;
      driveApiAdapter.exportGoogleFile = async (token, fileId, mime) => {
        assert.equal(token, srcAccount.accessToken);
        assert.equal(fileId, 'doc-1');
        exportedAs = mime;
        return new Blob(['docx bytes']);
      };
      driveApiAdapter.initiateResumableUpload = async (token, meta, mime) => {
        assert.equal(token, destAccount.accessToken);
        assert.equal(mime, exportedAs);
        uploadMeta = meta;
        return 'https://upload/session';
      };
      driveApiAdapter.uploadResumableChunk = async () => ({ complete: true, data: { id: 'new-doc' } });
      driveApiAdapter.downloadFileRange = async () => {
        throw new Error('Google Docs must not be range-downloaded');
      };

      const file = { id: 'doc-1', name: 'Project Plan', mimeType: 'application/vnd.google-apps.document' };
      const result = await transferFile(srcAccount, destAccount, file, 'root');

      assert.match(exportedAs, /wordprocessingml/);
      assert.equal(uploadMeta.mimeType, 'application/vnd.google-apps.document');
      assert.equal(result.id, 'new-doc');
      assert.equal(result.transferMode, 'export');
    });

    it('should reject Google file types that cannot be exported', async () => {
      driveApiAdapter.addPermission = async () => {
        throw new Error('Sharing disabled');
      };
      const file = { id: 'f', name: 'Survey', mimeType: 'application/vnd.google-apps.form' };
      await assert.rejects(() => transferFile(srcAccount, destAccount, file, 'root'), /can't be exported/);
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

  // ── 5. Cross-Cloud Transfers: Google Drive <-> Dropbox ─────
  describe('Cross-Cloud Transfers (Method 2: Bounded Stream with Dropbox)', () => {
    const dropboxAccount = {
      email: 'carol@dropbox.com',
      accessToken: 'dropbox-token-789',
      provider: 'dropbox',
    };

    it('should skip Strategy A and stream Google Drive file directly to Dropbox', async () => {
      let cloudCopyAttempted = false;
      let driveDownloadCalled = false;
      let dropboxUploadCalled = false;

      driveApiAdapter.addPermission = async () => {
        cloudCopyAttempted = true;
        return { id: 'p' };
      };

      driveApiAdapter.downloadFileRange = async (token, fileId, _start, _end) => {
        driveDownloadCalled = true;
        assert.equal(token, srcAccount.accessToken);
        assert.equal(fileId, 'gdrive-file-1');
        return new Blob(['dropbox file content slice']);
      };

      dropboxApiAdapter.uploadDropboxFileDirect = async (token, blob, targetPath) => {
        dropboxUploadCalled = true;
        assert.equal(token, dropboxAccount.accessToken);
        assert.equal(targetPath, '/Documents/Report.pdf');
        return { id: 'id:dbx123', name: 'Report.pdf', size: 100 };
      };

      const file = {
        id: 'gdrive-file-1',
        name: 'Report.pdf',
        mimeType: 'application/pdf',
        size: '100',
      };

      const result = await transferFile(srcAccount, dropboxAccount, file, '/Documents');

      assert.equal(cloudCopyAttempted, false, 'Strategy A must be skipped when target is Dropbox');
      assert.equal(driveDownloadCalled, true);
      assert.equal(dropboxUploadCalled, true);
      assert.equal(result.transferMode, 'stream');
    });

    it('should export a Google Sheet to .xlsx and upload it to Dropbox', async () => {
      driveApiAdapter.addPermission = async () => {
        throw new Error('Strategy A must be skipped for Dropbox');
      };
      driveApiAdapter.exportGoogleFile = async (_t, _id, mime) => {
        assert.match(mime, /spreadsheetml/);
        return new Blob(['xlsx bytes']);
      };
      let uploadedPath;
      dropboxApiAdapter.uploadDropboxFileDirect = async (token, _blob, path) => {
        assert.equal(token, dropboxAccount.accessToken);
        uploadedPath = path;
        return { id: 'id:sheet' };
      };

      const file = { id: 'sheet-1', name: 'Twitter Backup Code', mimeType: 'application/vnd.google-apps.spreadsheet', size: 0 };
      const result = await transferFile(srcAccount, dropboxAccount, file, '/Backups');

      assert.equal(uploadedPath, '/Backups/Twitter Backup Code.xlsx');
      assert.equal(result.transferMode, 'export');
    });

    it('should stream Dropbox file directly to Google Drive via resumable upload', async () => {
      let dbxDownloadCalled = false;
      let gdriveResumableCalled = false;
      let gdriveChunkUploaded = false;

      dropboxApiAdapter.downloadDropboxFileRange = async (token, pathOrId, _start, _end) => {
        dbxDownloadCalled = true;
        assert.equal(token, dropboxAccount.accessToken);
        assert.equal(pathOrId, '/photos/beach.png');
        return new Blob(['image binary slice']);
      };

      driveApiAdapter.initiateResumableUpload = async (token, meta, _mime, _totalSize) => {
        gdriveResumableCalled = true;
        assert.equal(token, destAccount.accessToken);
        assert.equal(meta.name, 'beach.png');
        return 'https://upload.google.com/session-url';
      };

      driveApiAdapter.uploadResumableChunk = async (url, _blob, _start, _end, _total) => {
        gdriveChunkUploaded = true;
        assert.equal(url, 'https://upload.google.com/session-url');
        return { complete: true, status: 200, data: { id: 'gdrive-beach', name: 'beach.png', size: '200' } };
      };

      const file = {
        id: 'id:beach',
        pathLower: '/photos/beach.png',
        name: 'beach.png',
        mimeType: 'image/png',
        size: '200',
        provider: 'dropbox',
      };

      const result = await transferFile(dropboxAccount, destAccount, file, 'folder-gdrive');

      assert.equal(dbxDownloadCalled, true);
      assert.equal(gdriveResumableCalled, true);
      assert.equal(gdriveChunkUploaded, true);
      assert.equal(result.transferMode, 'stream');
    });

    it('should transfer Dropbox folder recursively into Google Drive', async () => {
      const createdFolders = [];

      dropboxApiAdapter.listDropboxFiles = async (token, path) => {
        if (path === '/my_drop_folder') {
          return [
            { '.tag': 'file', id: 'id:f1', name: 'file1.txt', path_lower: '/my_drop_folder/file1.txt', size: 50 },
            { '.tag': 'folder', id: 'id:sub', name: 'sub', path_lower: '/my_drop_folder/sub' },
          ];
        }
        if (path === '/my_drop_folder/sub') {
          return [
            { '.tag': 'file', id: 'id:f2', name: 'file2.txt', path_lower: '/my_drop_folder/sub/file2.txt', size: 60 },
          ];
        }
        return [];
      };

      driveApiAdapter.createFolder = async (token, name, parentId) => {
        createdFolders.push({ name, parentId });
        return { id: `gfolder-${name}`, name };
      };

      dropboxApiAdapter.downloadDropboxFileRange = async () => new Blob(['data']);
      driveApiAdapter.initiateResumableUpload = async () => 'https://upload.google.com/s';
      driveApiAdapter.uploadResumableChunk = async (_url, _blob, _start, _end, total) => {
        return { complete: true, status: 200, data: { id: 'gfile', size: String(total) } };
      };

      const folder = {
        id: 'id:my_drop_folder',
        pathLower: '/my_drop_folder',
        name: 'my_drop_folder',
        provider: 'dropbox',
      };

      const progressUpdates = [];
      await transferFolder(
        dropboxAccount,
        destAccount,
        folder,
        'root',
        (p) => progressUpdates.push(p),
        { done: 0, total: 2 }
      );

      assert.equal(createdFolders.length, 2);
      assert.equal(createdFolders[0].name, 'my_drop_folder');
      assert.equal(createdFolders[1].name, 'sub');
      assert.equal(progressUpdates.length, 2);
    });
  });
});
