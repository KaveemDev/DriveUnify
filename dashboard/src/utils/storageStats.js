// Pure aggregations behind the storage analytics view.

const DAY = 24 * 60 * 60 * 1000;
const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

export const CATEGORIES = [
  { key: 'documents', label: 'Documents', color: '#3B82F6' },
  { key: 'images', label: 'Images', color: '#10B981' },
  { key: 'videos', label: 'Videos & audio', color: '#8B5CF6' },
  { key: 'spreadsheets', label: 'Spreadsheets', color: '#F59E0B' },
  { key: 'archives', label: 'Archives', color: '#EC4899' },
  { key: 'other', label: 'Other', color: '#6B7280' },
];

const SIZE_BUCKETS = [
  { label: '< 100 KB', max: 100 * KB },
  { label: '100 KB–1 MB', max: MB },
  { label: '1–10 MB', max: 10 * MB },
  { label: '10–100 MB', max: 100 * MB },
  { label: '100 MB–1 GB', max: GB },
  { label: '> 1 GB', max: Infinity },
];

const AGE_BUCKETS = [
  { label: '< 7 days', max: 7 * DAY },
  { label: '7–30 days', max: 30 * DAY },
  { label: '1–3 months', max: 90 * DAY },
  { label: '3–12 months', max: 365 * DAY },
  { label: '1–3 years', max: 3 * 365 * DAY },
  { label: '> 3 years', max: Infinity },
];

export const isFolderItem = (f) => f.isFolder || f.mimeType === 'application/vnd.google-apps.folder';

export const getExtension = (name = '') => {
  const i = name.lastIndexOf('.');
  return i > 0 && i < name.length - 1 ? name.slice(i + 1).toLowerCase() : '';
};

export const getCategory = (f) => {
  const m = (f.mimeType || '').toLowerCase();
  const ext = getExtension(f.name);
  if (m.startsWith('video/') || m.startsWith('audio/') || /^(mp4|mkv|mov|avi|webm|mp3|wav|flac|m4a|aac)$/.test(ext)) return 'videos';
  if (m.startsWith('image/') || /^(jpe?g|png|gif|webp|svg|heic|bmp|tiff?)$/.test(ext)) return 'images';
  if (m.includes('spreadsheet') || m.includes('excel') || m.includes('csv') || /^(xlsx?|csv|ods|numbers)$/.test(ext)) return 'spreadsheets';
  if (m.includes('zip') || m.includes('compressed') || m.includes('tar') || /^(zip|rar|7z|tar|gz|tgz|bz2|dmg|iso)$/.test(ext)) return 'archives';
  if (m.includes('document') || m.includes('pdf') || m.includes('word') || m.includes('presentation') || m.startsWith('text/')
    || /^(pdf|docx?|txt|md|rtf|odt|pptx?|key|pages)$/.test(ext)) return 'documents';
  return 'other';
};

const bucketIndex = (buckets, value) => buckets.findIndex((b) => value < b.max);

// Last 12 calendar months, oldest first, keyed "YYYY-MM"
const lastMonths = (now, n = 12) => {
  const d = new Date(now);
  return Array.from({ length: n }, (_, i) => {
    const m = new Date(d.getFullYear(), d.getMonth() - (n - 1 - i), 1);
    return {
      key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
      label: m.toLocaleString('en', { month: 'short' }),
      year: m.getFullYear(),
      count: 0,
      size: 0,
    };
  });
};

/**
 * @param files every file across the drives in scope (folders included)
 * @param now   injectable clock for tests
 */
export const computeStorageStats = (files = [], now = Date.now()) => {
  const items = files.filter((f) => !f.trashed);
  const folders = items.filter(isFolderItem);
  const regular = items.filter((f) => !isFolderItem(f));

  const categories = Object.fromEntries(CATEGORIES.map((c) => [c.key, { ...c, count: 0, size: 0 }]));
  const sizeBuckets = SIZE_BUCKETS.map((b) => ({ label: b.label, count: 0, size: 0 }));
  const ageBuckets = AGE_BUCKETS.map((b) => ({ label: b.label, count: 0, size: 0 }));
  const months = lastMonths(now);
  const monthByKey = Object.fromEntries(months.map((m) => [m.key, m]));
  const extensions = {};
  const dupGroups = {};

  let totalSize = 0;
  let cloudNative = 0; // Google Docs/Sheets/Slides report no size and don't use quota
  let shared = 0;
  let starred = 0;
  let addedLast30 = 0;
  let newest = null;
  let oldest = null;

  for (const f of regular) {
    const size = Number(f.size) || 0;
    totalSize += size;
    if (!size && (f.mimeType || '').startsWith('application/vnd.google-apps.')) cloudNative += 1;
    if (f.shared) shared += 1;
    if (f.starred) starred += 1;

    const cat = categories[getCategory(f)];
    cat.count += 1;
    cat.size += size;

    const sb = sizeBuckets[bucketIndex(SIZE_BUCKETS, size)];
    sb.count += 1;
    sb.size += size;

    const modified = Date.parse(f.modifiedTime);
    if (!Number.isNaN(modified)) {
      const ab = ageBuckets[bucketIndex(AGE_BUCKETS, Math.max(0, now - modified))];
      ab.count += 1;
      ab.size += size;
      if (!newest || modified > Date.parse(newest.modifiedTime)) newest = f;
      if (!oldest || modified < Date.parse(oldest.modifiedTime)) oldest = f;
    }

    const created = f.createdTime && new Date(f.createdTime);
    if (created && !Number.isNaN(created.getTime())) {
      if (now - created.getTime() < 30 * DAY) addedLast30 += size;
      const m = monthByKey[`${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`];
      if (m) {
        m.count += 1;
        m.size += size;
      }
    }

    const ext = getExtension(f.name) || '(none)';
    extensions[ext] ??= { ext, count: 0, size: 0 };
    extensions[ext].count += 1;
    extensions[ext].size += size;

    // shortcut: name+size match, not a content hash; switch to md5Checksum if false positives show up
    if (size > 0) (dupGroups[`${f.name}\u0000${size}`] ??= []).push(f);
  }

  const duplicates = Object.values(dupGroups)
    .filter((g) => g.length > 1)
    .map((g) => ({ name: g[0].name, size: Number(g[0].size), copies: g.length, wasted: Number(g[0].size) * (g.length - 1), files: g }))
    .sort((a, b) => b.wasted - a.wasted);

  return {
    totalSize,
    fileCount: regular.length,
    folderCount: folders.length,
    averageSize: regular.length ? totalSize / regular.length : 0,
    medianSize: median(regular.map((f) => Number(f.size) || 0).filter(Boolean)),
    cloudNative,
    addedLast30,
    shared,
    starred,
    newest,
    oldest,
    categories: Object.values(categories),
    sizeBuckets,
    ageBuckets,
    months,
    extensions: Object.values(extensions).sort((a, b) => b.size - a.size || b.count - a.count),
    largest: [...regular].sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0)).slice(0, 10),
    duplicates,
    duplicateWaste: duplicates.reduce((s, d) => s + d.wasted, 0),
  };
};

const median = (nums) => {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// Health band for a quota percentage
export const usageLevel = (pct) => (pct >= 90 ? 'critical' : pct >= 75 ? 'warning' : 'good');
