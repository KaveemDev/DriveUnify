import { it, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { googleDriveAdapter as gd, dropboxAdapter as dbx } from '../providers.js';
import { ERR } from '../core.js';

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const account = { email: 'u@example.com', accessToken: 'tok' };
const chunk = { length: 4, sha256: 'abc', contentHash: 'dbx' };

describe('provider adapters (mocked fetch)', () => {
  let realFetch; let calls; let replies;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    calls = [];
    replies = [];
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: String(url), init });
      const next = replies.shift();
      if (!next) throw new Error(`unexpected fetch ${url}`);
      return typeof next === 'function' ? next(url, init) : next;
    };
  });
  afterEach(() => { globalThis.fetch = realFetch; });

  describe('Google Drive', () => {
    it('uploads into the tagged folder with a single resumable PUT', async () => {
      replies.push(
        json(200, { files: [{ id: 'folder1' }] }),
        new Response(null, { status: 200, headers: { Location: 'https://upload/session' } }),
        json(200, { id: 'obj1', size: '4', sha256Checksum: 'abc' }),
      );
      const out = await gd.uploadObject(account, 'f.000000.part', new Blob([new Uint8Array(4)]), {});
      assert.deepEqual(out, { objectId: 'obj1', size: 4, checksum: 'abc' });
      const meta = JSON.parse(calls[1].init.body);
      assert.deepEqual(meta.parents, ['folder1']);
      assert.equal(meta.appProperties.duName, 'f.000000.part');
      assert.equal(calls[2].init.headers['Content-Range'], 'bytes 0-3/4');
      assert.equal(calls[1].init.headers.Authorization, 'Bearer tok');
    });

    it('classifies quota, rate-limit and auth errors', async () => {
      const err = (status, reason) => json(status, { error: { message: 'm', errors: [{ reason }] } });
      replies.push(err(403, 'storageQuotaExceeded'));
      await assert.rejects(gd.getCapacity(account), (e) => e.kind === ERR.QUOTA);
      replies.push(err(403, 'userRateLimitExceeded'));
      await assert.rejects(gd.getCapacity(account), (e) => e.kind === ERR.RATE_LIMIT && e.retryable);
      replies.push(err(401, 'authError'));
      await assert.rejects(gd.getCapacity(account), (e) => e.kind === ERR.AUTH && !e.retryable);
      replies.push(() => { throw new TypeError('Failed to fetch'); });
      await assert.rejects(gd.getCapacity(account), (e) => e.kind === ERR.NETWORK && e.retryable);
    });

    it('treats a missing limit as unlimited storage', async () => {
      replies.push(json(200, { storageQuota: { usage: '10' } }));
      assert.deepEqual(await gd.getCapacity(account), { limit: null, used: 10 });
    });

    it('verifies by sha256Checksum and distinguishes missing / mismatch / unknown', async () => {
      replies.push(json(200, { id: 'o', size: '4', sha256Checksum: 'abc' }));
      assert.equal(await gd.verifyObject(account, 'o', chunk), 'verified');
      replies.push(json(200, { id: 'o', size: '4', sha256Checksum: 'zzz' }));
      assert.equal(await gd.verifyObject(account, 'o', chunk), 'mismatch');
      replies.push(json(200, { id: 'o', size: '4' }));
      assert.equal(await gd.verifyObject(account, 'o', chunk), 'unknown');
      replies.push(json(404, { error: { message: 'not found' } }));
      assert.equal(await gd.verifyObject(account, 'o', chunk), 'missing');
      replies.push(json(200, { id: 'o', size: '4', sha256Checksum: 'abc', trashed: true }));
      assert.equal(await gd.verifyObject(account, 'o', chunk), 'missing');
    });

    it('deletion is idempotent but surfaces real failures', async () => {
      replies.push(new Response(null, { status: 204 }));
      await gd.deleteObject(account, 'o');
      assert.equal(calls[0].init.method, 'DELETE');
      replies.push(json(404, {}));
      await gd.deleteObject(account, 'o');
      replies.push(json(500, {}));
      await assert.rejects(gd.deleteObject(account, 'o'), (e) => e.kind === ERR.NETWORK);
    });
  });

  describe('Dropbox', () => {
    it('uploads with overwrite mode and content_hash', async () => {
      replies.push(json(200, { id: 'id:1', size: 4, content_hash: 'dbx' }));
      const out = await dbx.uploadObject(account, 'f.000000.part', new Blob([new Uint8Array(4)]), { contentHash: 'dbx' });
      assert.deepEqual(out, { objectId: 'id:1', size: 4, checksum: 'dbx' });
      const arg = JSON.parse(calls[0].init.headers['Dropbox-API-Arg']);
      assert.equal(arg.mode, 'overwrite');
      assert.equal(arg.content_hash, 'dbx');
      assert.equal(arg.path, '/DriveUnify Unified Storage/f.000000.part');
    });

    it('classifies 409 error summaries and honours Retry-After', async () => {
      replies.push(json(409, { error_summary: 'path/insufficient_space/..' }));
      await assert.rejects(dbx.uploadObject(account, 'n', new Blob([]), {}), (e) => e.kind === ERR.QUOTA);
      replies.push(json(409, { error_summary: 'content_hash_mismatch/' }));
      await assert.rejects(dbx.uploadObject(account, 'n', new Blob([]), {}), (e) => e.kind === ERR.CHECKSUM);
      replies.push(json(429, { error_summary: 'too_many_requests/' }, { 'Retry-After': '3' }));
      await assert.rejects(dbx.uploadObject(account, 'n', new Blob([]), {}), (e) => e.kind === ERR.RATE_LIMIT && e.retryAfterMs === 3000);
      replies.push(json(401, { error_summary: 'expired_access_token/' }));
      await assert.rejects(dbx.uploadObject(account, 'n', new Blob([]), {}), (e) => e.kind === ERR.AUTH);
    });

    it('find/verify/delete treat not_found as absence', async () => {
      replies.push(json(409, { error_summary: 'path/not_found/' }));
      assert.deepEqual(await dbx.findObjects(account, 'n'), []);
      replies.push(json(409, { error_summary: 'path/not_found/' }));
      assert.equal(await dbx.verifyObject(account, 'id:1', chunk), 'missing');
      replies.push(json(200, { '.tag': 'file', id: 'id:1', size: 4, content_hash: 'other' }));
      assert.equal(await dbx.verifyObject(account, 'id:1', chunk), 'mismatch');
      replies.push(json(409, { error_summary: 'path_lookup/not_found/' }));
      await dbx.deleteObject(account, 'id:1');
    });
  });
});
