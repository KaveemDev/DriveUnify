import { it, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeStorageStats, getCategory, usageLevel } from '../storageStats.js';

const NOW = Date.parse('2026-10-29T12:00:00Z');
const MB = 1024 ** 2;
const file = (name, size, extra = {}) => ({
  id: name + Math.random(), name, size, mimeType: '', modifiedTime: '2026-10-28T00:00:00Z', createdTime: '2026-10-01T00:00:00Z', ...extra,
});

describe('computeStorageStats', () => {
  const stats = computeStorageStats([
    file('a.jpg', 2 * MB),
    file('a.jpg', 2 * MB),
    file('report.pdf', 500 * 1024, { shared: true, modifiedTime: '2020-01-01T00:00:00Z' }),
    file('Doc', 0, { mimeType: 'application/vnd.google-apps.document' }),
    file('Photos', 0, { isFolder: true }),
    file('gone.zip', 9 * MB, { trashed: true }),
  ], NOW);

  it('counts files, folders and size, skipping trash', () => {
    assert.equal(stats.fileCount, 4);
    assert.equal(stats.folderCount, 1);
    assert.equal(stats.totalSize, 4 * MB + 500 * 1024);
    assert.equal(stats.cloudNative, 1);
    assert.equal(stats.shared, 1);
    assert.equal(stats.addedLast30, 4 * MB + 500 * 1024);
  });

  it('finds duplicates and wasted bytes', () => {
    assert.equal(stats.duplicates.length, 1);
    assert.equal(stats.duplicateWaste, 2 * MB);
  });

  it('buckets by category, size, age and month', () => {
    assert.equal(stats.categories.find((c) => c.key === 'images').count, 2);
    assert.equal(stats.sizeBuckets[2].count, 2); // 1–10 MB
    assert.equal(stats.ageBuckets[5].count, 1); // > 3 years
    assert.equal(stats.months.at(-1).count, 4);
    assert.equal(stats.oldest.name, 'report.pdf');
  });
});

it('getCategory falls back to the extension', () => {
  assert.equal(getCategory({ name: 'x.MKV' }), 'videos');
  assert.equal(getCategory({ name: 'x.tar.gz' }), 'archives');
});

it('usageLevel bands', () => {
  assert.deepEqual([50, 75, 95].map(usageLevel), ['good', 'warning', 'critical']);
});
