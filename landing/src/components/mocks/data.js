export const ACCOUNTS = [
  { id: 'work', name: 'Work Drive', short: 'Work', color: '#60a5fa', used: 10.8, total: 15 },
  { id: 'personal', name: 'Personal Drive', short: 'Personal', color: '#f59e0b', used: 6.2, total: 15 },
  { id: 'dropbox', name: 'Dropbox', short: 'Dropbox', color: '#0061FF', used: 1.2, total: 2 },
];

export const accountById = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a]));

export const TYPE_COLORS = { pdf: '#f87171', docx: '#60a5fa', xlsx: '#4ade80', mp4: '#c084fc', jpg: '#fbbf24', folder: '#94a3b8' };

export const FILES = [
  { name: 'wedding-photos/', type: 'folder', account: 'personal' },
  { name: 'Q3-report.pdf', type: 'pdf', account: 'work' },
  { name: 'thesis-final-v7.docx', type: 'docx', account: 'dropbox' },
  { name: 'budget-2026.xlsx', type: 'xlsx', account: 'work' },
  { name: 'launch-teaser.mp4', type: 'mp4', account: 'dropbox' },
  { name: 'client-assets/', type: 'folder', account: 'work' },
  { name: 'passport-scan.jpg', type: 'jpg', account: 'personal' },
  { name: 'lease-agreement.pdf', type: 'pdf', account: 'personal' },
];
