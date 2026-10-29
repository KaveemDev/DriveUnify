import { it, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getSpaceSuggestion } from '../storage.js';

const GB = 1024 ** 3;
const acct = (email, used, limit, extra = {}) => ({
  email, accessToken: 't', storage: { used: used * GB, limit: limit * GB }, ...extra,
});

describe('getSpaceSuggestion', () => {
  it('pairs the fullest drive with the one that has the most free space', () => {
    const full = acct('a', 12.4, 15);
    const roomy = acct('b', 41.8, 100);
    const s = getSpaceSuggestion([full, acct('c', 1, 2), roomy]);
    assert.equal(s.from, full);
    assert.equal(s.to, roomy);
    assert.equal(s.usedPercent, 83);
  });

  it('returns null when no drive is at least 75% full', () => {
    assert.equal(getSpaceSuggestion([acct('a', 5, 15), acct('b', 10, 100)]), null);
  });

  it('ignores expired drives and drives without a limit', () => {
    const accounts = [acct('a', 14, 15), acct('b', 0, 100, { expired: true }), acct('c', 0, 0)];
    assert.equal(getSpaceSuggestion(accounts), null);
  });

  it('returns null with a single drive', () => {
    assert.equal(getSpaceSuggestion([acct('a', 14, 15)]), null);
  });
});
