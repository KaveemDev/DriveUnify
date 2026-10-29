export const isAccountExpired = (account) =>
  Boolean(account.expired || account.needsReconnect || !account.accessToken);

const usedPct = (a) => (a.storage.used / a.storage.limit) * 100;
const freeBytes = (a) => a.storage.limit - a.storage.used;

// Fullest healthy drive (≥75% used) paired with the healthy drive that has the most free space.
export const getSpaceSuggestion = (accounts = []) => {
  const healthy = accounts.filter((a) => !isAccountExpired(a) && a.storage?.limit > 0);
  const fullest = [...healthy].sort((a, b) => usedPct(b) - usedPct(a))[0];
  if (!fullest || usedPct(fullest) < 75) return null;
  const target = healthy
    .filter((a) => a !== fullest)
    .sort((a, b) => freeBytes(b) - freeBytes(a))[0];
  if (!target || freeBytes(target) <= freeBytes(fullest)) return null;
  return {
    from: fullest,
    to: target,
    usedPercent: Math.round(usedPct(fullest)),
    freeOnTarget: freeBytes(target),
  };
};
