import { it, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { createEngine } from '../engine.js';
import { createMemoryRepo, UnifiedError, ERR } from '../core.js';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Fake provider: an in-memory object store. `hooks` let tests inject failures. */
const fakeProvider = (provider, { limit = 1e12 } = {}) => {
  const objects = new Map();
  let seq = 0;
  const hooks = { beforeUpload: null, deleteFailures: 0, tamper: null };
  const used = () => [...objects.values()].reduce((s, o) => s + o.bytes.length, 0);
  const view = (id, o) => ({ objectId: id, size: o.bytes.length, checksum: sha(o.bytes) });
  return {
    objects, hooks, provider,
    async getCapacity() { return { limit, used: used() }; },
    async findObjects(_a, name) { return [...objects].filter(([, o]) => o.name === name).map(([id, o]) => view(id, o)); },
    async uploadObject(_a, name, blob) {
      await hooks.beforeUpload?.(name);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (used() + bytes.length > limit) throw new UnifiedError(ERR.QUOTA, 'full');
      if (provider === 'dropbox') for (const [id, o] of objects) if (o.name === name) objects.delete(id); // overwrite mode
      const id = `${provider}-${++seq}`;
      objects.set(id, { name, bytes: hooks.tamper ? hooks.tamper(bytes) : bytes });
      return view(id, objects.get(id));
    },
    async verifyObject(_a, id, chunk) {
      const o = objects.get(id);
      if (!o) return 'missing';
      return o.bytes.length === chunk.length && sha(o.bytes) === chunk.sha256 ? 'verified' : 'mismatch';
    },
    async downloadObject(_a, id) {
      const o = objects.get(id);
      if (!o) throw new UnifiedError(ERR.NOT_FOUND, 'gone');
      return o.bytes.slice().buffer;
    },
    async deleteObject(_a, id) {
      if (hooks.deleteFailures > 0) { hooks.deleteFailures--; throw new UnifiedError(ERR.PERMISSION, 'denied'); }
      objects.delete(id);
    },
  };
};

const memorySink = () => {
  const parts = [];
  return {
    parts, closed: false, aborted: false,
    async write(u8) { parts.push(u8.slice()); },
    async close() { this.closed = true; },
    async abort() { this.aborted = true; },
    bytes() { return Buffer.concat(parts); },
  };
};

const makeFile = (size, seed = 7, name = 'video.mp4') => {
  const bytes = new Uint8Array(size).map((_, i) => (i * seed + 13) % 256);
  return { file: new File([bytes], name, { lastModified: 1700000000000, type: 'video/mp4' }), bytes };
};

describe('Unified Storage engine', () => {
  let repo; let gd; let dbx; let clock; let accounts;
  const engine = (opts = {}) => createEngine({
    repo,
    adapters: { google_drive: gd, dropbox: dbx },
    listAccounts: async () => accounts,
    getAccount: async (email) => accounts.find((a) => a.email === email),
    chunkSize: 1000,
    now: () => clock,
    retry: { baseMs: 1, retries: 1 },
    ...opts,
  });

  beforeEach(() => {
    repo = createMemoryRepo();
    gd = fakeProvider('google_drive');
    dbx = fakeProvider('dropbox');
    clock = 1_000_000;
    accounts = [
      { email: 'a@gmail.com', provider: 'google_drive', accessToken: 't1' },
      { email: 'b@dropbox.com', provider: 'dropbox', accessToken: 't2' },
    ];
  });

  // Small capacities so the 256 MiB safety margin doesn't hide everything.
  const smallPool = (aLimit, bLimit) => {
    const margin = 256 * 1024 * 1024;
    gd = fakeProvider('google_drive', { limit: margin + aLimit });
    dbx = fakeProvider('dropbox', { limit: margin + bLimit });
  };

  it('uploads across providers, marks ready, and reconstructs identical bytes', async () => {
    const { file, bytes } = makeFile(4500);
    const e = engine();
    const id = await e.startUpload(file);
    const doc = await repo.getFile(id);
    assert.equal(doc.state, 'ready');
    assert.equal(doc.chunkCount, 5);
    assert.equal(doc.verifiedCount, 5);
    assert.equal(doc.bytesVerified, 4500);
    assert.ok(gd.objects.size > 0 && dbx.objects.size > 0, 'chunks spread across both providers');
    const sink = memorySink();
    await e.downloadFile(id, sink);
    assert.ok(sink.closed);
    assert.deepEqual(new Uint8Array(sink.bytes()), bytes);
  });

  it('reconciles an object committed before metadata failed, without duplicating it', async () => {
    accounts = [accounts[0]]; // Drive has no overwrite mode: duplicates would show up here
    const { file } = makeFile(3000);
    const e = engine();
    const real = repo.updateChunk;
    let failed = false;
    repo.updateChunk = async (fid, cid, patch, o) => {
      if (patch.state === 'uploaded' && cid === 'c000001' && !failed) { failed = true; throw Object.assign(new Error('x'), { code: 'unavailable' }); }
      return real(fid, cid, patch, o);
    };
    let id;
    await assert.rejects(e.startUpload(file, { onCreated: (x) => { id = x; } }), (err) => err.kind === ERR.METADATA);
    assert.equal((await repo.getFile(id)).sessionState, 'interrupted');
    await e.resumeUpload(id, file);
    assert.equal((await repo.getFile(id)).state, 'ready');
    assert.equal(gd.objects.size, 3, 'exactly one object per logical chunk');
    assert.equal((await repo.listChunks(id)).length, 3);
  });

  it('blocks a second tab while the lease is live and lets it take over after expiry', async () => {
    const { file } = makeFile(2000);
    let release;
    const gate = new Promise((r) => { release = r; });
    gd.hooks.beforeUpload = () => gate;
    dbx.hooks.beforeUpload = () => gate;
    const tabA = engine({ tabId: 'A' });
    const tabB = engine({ tabId: 'B' });
    let id;
    const running = tabA.startUpload(file, { onCreated: (x) => { id = x; } });
    await new Promise((r) => setTimeout(r, 10));
    await assert.rejects(tabB.resumeUpload(id, file), (err) => err.kind === ERR.CONFLICT);
    // Tab A "dies": lease expires, B takes over; A's late writes are now rejected.
    clock += 10 * 60 * 1000;
    gd.hooks.beforeUpload = null; dbx.hooks.beforeUpload = null;
    await tabB.resumeUpload(id, file);
    release();
    await assert.rejects(running, (err) => err.kind === ERR.CONFLICT);
    const doc = await repo.getFile(id);
    assert.equal(doc.state, 'ready');
    assert.equal(doc.verifiedCount, 2);
  });

  it('moves remaining chunks to another drive when one fills up mid-upload', async () => {
    smallPool(100_000, 100_000);
    const { file, bytes } = makeFile(4000);
    let n = 0;
    gd.hooks.beforeUpload = () => { if (++n > 1) throw new UnifiedError(ERR.QUOTA, 'Drive full'); };
    const e = engine();
    const id = await e.startUpload(file);
    assert.equal((await repo.getFile(id)).state, 'ready');
    assert.equal(gd.objects.size, 1);
    assert.equal(dbx.objects.size, 3);
    const sink = memorySink();
    await e.downloadFile(id, sink);
    assert.deepEqual(new Uint8Array(sink.bytes()), bytes);
  });

  it('refuses to plan when known capacity is insufficient', async () => {
    smallPool(1000, 1000);
    await assert.rejects(engine().startUpload(makeFile(3000).file), (err) => err.kind === ERR.CAPACITY);
    assert.equal((await repo.listFiles()).length, 0, 'nothing persisted');
  });

  it('never marks a file ready when verification keeps failing', async () => {
    gd.hooks.tamper = (b) => { const c = b.slice(); c[0] ^= 1; return c; };
    dbx.hooks.tamper = gd.hooks.tamper;
    let id;
    await assert.rejects(engine().startUpload(makeFile(1500).file, { onCreated: (x) => { id = x; } }), (err) => err.kind === ERR.CHECKSUM);
    assert.equal((await repo.getFile(id)).state, 'uploading');
  });

  it('detects a corrupted chunk on download, degrades the file, and repairs it from the source', async () => {
    const { file, bytes } = makeFile(3500);
    const e = engine();
    const id = await e.startUpload(file);
    const victim = (await repo.listChunks(id))[1];
    const store = victim.provider === 'dropbox' ? dbx : gd;
    store.objects.get(victim.objectId).bytes[5] ^= 0xff;

    const sink = memorySink();
    await assert.rejects(e.downloadFile(id, sink), (err) => err.kind === ERR.CHECKSUM);
    assert.ok(sink.aborted && !sink.closed, 'partial output discarded');
    assert.equal((await repo.getFile(id)).state, 'degraded');
    assert.equal((await repo.listChunks(id))[1].state, 'corrupted');

    await assert.rejects(e.repairFile(id, makeFile(3500, 9).file), (err) => err.kind === ERR.SOURCE_MISMATCH);
    await e.repairFile(id, file);
    assert.equal((await repo.getFile(id)).state, 'ready');
    assert.equal(store.objects.has(victim.objectId), false, 'old corrupted object cleaned up after replacement verified');
    const ok = memorySink();
    await e.downloadFile(id, ok);
    assert.deepEqual(new Uint8Array(ok.bytes()), bytes);
  });

  it('reports a missing chunk via integrity check (not a network error)', async () => {
    const e = engine();
    const id = await e.startUpload(makeFile(2500).file);
    const victim = (await repo.listChunks(id))[0];
    (victim.provider === 'dropbox' ? dbx : gd).objects.delete(victim.objectId);
    const result = await e.checkIntegrity(id);
    assert.deepEqual(result.problems.map((p) => p.state), ['missing']);
    assert.equal((await repo.getFile(id)).state, 'degraded');
  });

  it('pauses on cancel and resumes only with the matching source file', async () => {
    const { file, bytes } = makeFile(5000);
    const e = engine();
    const ctrl = new AbortController();
    let uploads = 0;
    const abortAfterTwo = () => { if (++uploads === 2) ctrl.abort(); };
    gd.hooks.beforeUpload = abortAfterTwo;
    dbx.hooks.beforeUpload = abortAfterTwo;
    let id;
    await assert.rejects(e.startUpload(file, { signal: ctrl.signal, onCreated: (x) => { id = x; } }), (err) => err.kind === ERR.CANCELLED);
    assert.equal((await repo.getFile(id)).sessionState, 'paused');
    gd.hooks.beforeUpload = null; dbx.hooks.beforeUpload = null;

    await assert.rejects(e.resumeUpload(id, makeFile(4999).file), (err) => err.kind === ERR.SOURCE_MISMATCH);
    await assert.rejects(e.resumeUpload(id, makeFile(5000, 3).file), (err) => err.kind === ERR.SOURCE_MISMATCH);
    await e.resumeUpload(id, file);
    assert.equal((await repo.getFile(id)).state, 'ready');
    const sink = memorySink();
    await e.downloadFile(id, sink);
    assert.deepEqual(new Uint8Array(sink.bytes()), bytes);
  });

  it('deletes all objects; failed deletions stay pending and are retried safely', async () => {
    const e = engine();
    const id = await e.startUpload(makeFile(4000).file);
    gd.hooks.deleteFailures = 50;
    const first = await e.deleteFile(id);
    assert.ok(first.pending > 0);
    assert.equal((await repo.getFile(id)).state, 'deleting', 'file not reported deleted while objects may remain');
    gd.hooks.deleteFailures = 0;
    clock += 2 * 60 * 60 * 1000;
    const second = await e.runCleanup();
    assert.equal(second.pending, 0);
    assert.equal(gd.objects.size + dbx.objects.size, 0);
    assert.equal(await repo.getFile(id), null);
    assert.equal((await e.runCleanup()).pending, 0, 'repeat run is a no-op');
  });

  it('deleting an interrupted upload also finds objects whose IDs were never recorded', async () => {
    accounts = [accounts[0]];
    const { file } = makeFile(2000);
    const real = repo.updateChunk;
    repo.updateChunk = async (fid, cid, patch, o) => {
      if (patch.state === 'uploaded') throw Object.assign(new Error('x'), { code: 'unavailable' });
      return real(fid, cid, patch, o);
    };
    let id;
    await assert.rejects(engine().startUpload(file, { onCreated: (x) => { id = x; } }));
    repo.updateChunk = real;
    assert.ok(gd.objects.size >= 1);
    await engine().deleteFile(id);
    assert.equal(gd.objects.size, 0);
  });

  it('pauses with an auth error when an account needs reconnecting', async () => {
    accounts = [{ ...accounts[0], accessToken: null }, accounts[1]];
    const { file } = makeFile(1000);
    // Only Dropbox is eligible to plan; then revoke it mid-way.
    dbx.hooks.beforeUpload = () => { throw new UnifiedError(ERR.AUTH, 'expired'); };
    let id;
    await assert.rejects(engine().startUpload(file, { onCreated: (x) => { id = x; } }), (err) => err.kind === ERR.AUTH);
    assert.equal((await repo.getFile(id)).sessionState, 'interrupted');
  });
});
