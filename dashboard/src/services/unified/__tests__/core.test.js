import { it, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import {
  planChunks, objectName, sha256Hex, dropboxContentHash, manifestHash,
  allocateChunks, usableCapacity, withRetry, UnifiedError, ERR,
  assertFileTransition, assertChunkTransition, applyChunkPatch, acquireLeasePatch, checkLease,
  effectiveSessionState, sanitizeFilename, runPool, DROPBOX_BLOCK_SIZE,
} from '../core.js';

const MiB = 1024 * 1024;

describe('planChunks', () => {
  it('handles a file smaller than one chunk', () => {
    assert.deepEqual(planChunks(10, 64), [{ id: 'c000000', index: 0, offset: 0, length: 10 }]);
  });
  it('handles an exactly divisible size', () => {
    const c = planChunks(128, 64);
    assert.equal(c.length, 2);
    assert.deepEqual(c.map((x) => [x.offset, x.length]), [[0, 64], [64, 64]]);
  });
  it('handles a final partial chunk and keeps offsets contiguous', () => {
    const c = planChunks(150, 64);
    assert.deepEqual(c.map((x) => x.length), [64, 64, 22]);
    c.forEach((x, i) => assert.equal(x.offset, i * 64));
  });
  it('computes counts from actual size (15 GB vs 15 GiB at 64 MiB)', () => {
    assert.equal(Math.ceil(15e9 / (64 * MiB)), 224); // arithmetic sanity, no allocation
    assert.equal(planChunks(15e9, 64 * MiB).length, 224);
    assert.equal(planChunks(15 * 1024 * MiB, 64 * MiB).length, 240);
  });
  it('returns no chunks for an empty file and rejects bad input', () => {
    assert.deepEqual(planChunks(0, 64), []);
    assert.throws(() => planChunks(-1, 64));
    assert.throws(() => planChunks(1.5, 64));
  });
  it('object names are deterministic per chunk and generation', () => {
    assert.equal(objectName('f1', 3), 'f1.000003.part');
    assert.equal(objectName('f1', 3, 2), 'f1.000003.r2.part');
  });
});

describe('hashing', () => {
  it('sha256Hex matches node crypto', async () => {
    const data = new TextEncoder().encode('driveunify');
    assert.equal(await sha256Hex(data), createHash('sha256').update(data).digest('hex'));
  });
  it('dropboxContentHash follows the 4 MiB block-hash spec', async () => {
    const data = new Uint8Array(DROPBOX_BLOCK_SIZE + 123).map((_, i) => i % 251);
    const blocks = [data.subarray(0, DROPBOX_BLOCK_SIZE), data.subarray(DROPBOX_BLOCK_SIZE)]
      .map((b) => createHash('sha256').update(b).digest());
    const expected = createHash('sha256').update(Buffer.concat(blocks)).digest('hex');
    assert.equal(await dropboxContentHash(data), expected);
  });
  it('manifestHash is order sensitive', async () => {
    const a = createHash('sha256').update('a').digest('hex');
    const b = createHash('sha256').update('b').digest('hex');
    assert.notEqual(await manifestHash([a, b]), await manifestHash([b, a]));
  });
});

describe('capacity planner', () => {
  it('subtracts reservations and a safety margin; unlimited stays unlimited', () => {
    assert.equal(usableCapacity({ limit: 10e9, used: 1e9 }, 1e9), 10e9 - 2e9 - 256 * MiB);
    assert.equal(usableCapacity({ limit: 1e9, used: 1e9 }), 0);
    assert.equal(usableCapacity({ limit: null, used: 5 }), Number.MAX_SAFE_INTEGER);
  });
  it('spreads chunks to the drive with most remaining space', () => {
    const chunks = planChunks(400, 100);
    const plan = allocateChunks(chunks, [
      { email: 'a', provider: 'google_drive', usable: 300 },
      { email: 'b', provider: 'dropbox', usable: 200 },
    ]);
    assert.deepEqual([...plan.values()].map((p) => p.email), ['a', 'a', 'b', 'a']);
  });
  it('rejects when combined capacity is insufficient', () => {
    assert.throws(() => allocateChunks(planChunks(500, 100), [{ email: 'a', usable: 300 }, { email: 'b', usable: 100 }]),
      (e) => e.kind === ERR.CAPACITY);
  });
  it('rejects when free space is too fragmented for indivisible chunks', () => {
    assert.throws(() => allocateChunks(planChunks(200, 100), [{ email: 'a', usable: 150 }, { email: 'b', usable: 60 }]),
      /fragmented/);
  });
});

describe('withRetry', () => {
  it('retries transient errors then succeeds', async () => {
    let n = 0;
    const out = await withRetry(async () => { if (++n < 3) throw new UnifiedError(ERR.NETWORK, 'x'); return 'ok'; }, { baseMs: 1 });
    assert.equal(out, 'ok');
    assert.equal(n, 3);
  });
  it('does not retry auth or quota failures', async () => {
    for (const kind of [ERR.AUTH, ERR.QUOTA, ERR.CHECKSUM]) {
      let n = 0;
      await assert.rejects(withRetry(async () => { n++; throw new UnifiedError(kind, 'x'); }, { baseMs: 1 }), (e) => e.kind === kind);
      assert.equal(n, 1);
    }
  });
  it('gives up after the retry budget', async () => {
    let n = 0;
    await assert.rejects(withRetry(async () => { n++; throw new UnifiedError(ERR.RATE_LIMIT, 'x'); }, { retries: 2, baseMs: 1 }));
    assert.equal(n, 3);
  });
});

describe('state rules', () => {
  it('rejects invalid transitions', () => {
    assert.throws(() => assertFileTransition('uploading', 'deleted'));
    assert.throws(() => assertFileTransition('deleted', 'ready'));
    assert.throws(() => assertChunkTransition('pending', 'verified'));
    assertFileTransition('degraded', 'ready');
    assertChunkTransition('corrupted', 'verified');
  });
  it('counter updates are idempotent', () => {
    const file = { verifiedCount: 0, bytesVerified: 0 };
    const chunk = { state: 'uploaded', length: 10 };
    const first = applyChunkPatch(file, chunk, { state: 'verified' });
    assert.deepEqual(first.filePatch, { verifiedCount: 1, bytesVerified: 10 });
    const replay = applyChunkPatch({ ...file, ...first.filePatch }, first.chunk, { state: 'verified' });
    assert.deepEqual(replay.filePatch, {});
    const lost = applyChunkPatch({ verifiedCount: 1, bytesVerified: 10 }, first.chunk, { state: 'missing' });
    assert.deepEqual(lost.filePatch, { verifiedCount: 0, bytesVerified: 0 });
  });
  it('leases block a second live tab but allow takeover after expiry', () => {
    const file = { state: 'uploading', sessionState: 'active', leaseOwner: 'tabA', leaseExpiresAt: 1000 };
    assert.throws(() => acquireLeasePatch(file, 'tabB', 100, 500), (e) => e.kind === ERR.CONFLICT);
    assert.equal(acquireLeasePatch(file, 'tabB', 100, 2000).leaseOwner, 'tabB');
    assert.throws(() => checkLease({ ...file, leaseOwner: 'tabB' }, 'tabA', 500), (e) => e.kind === ERR.CONFLICT);
    assert.equal(effectiveSessionState(file, 2000), 'interrupted');
    assert.equal(effectiveSessionState(file, 500), 'active');
  });
});

describe('helpers', () => {
  it('sanitizeFilename strips path characters', () => {
    assert.equal(sanitizeFilename('../a/b\\c:d.zip'), '__a_b_c_d.zip');
    assert.equal(sanitizeFilename(''), 'download');
  });
  it('runPool respects the concurrency limit', async () => {
    let active = 0; let peak = 0;
    await runPool([1, 2, 3, 4, 5], 2, async () => { peak = Math.max(peak, ++active); await new Promise((r) => setTimeout(r, 5)); active--; });
    assert.equal(peak, 2);
  });
});
