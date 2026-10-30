import React from 'react';
import { Cloud, SearchX } from 'lucide-react';

const EMPTY_BY_NAV = {
  starred: { title: 'No starred files', desc: 'Star files and folders from your library to access them quickly here.' },
  recent: { title: 'No recent activity', desc: 'Files you open, upload, or modify will appear here.' },
  shared: { title: 'No shared files', desc: 'Items shared with your connected accounts will be displayed here.' },
  trash: { title: 'Trash is empty', desc: 'Deleted items will be held here until permanently removed.' },
};
const DEFAULT_EMPTY = { title: 'No files found', desc: 'Upload files or drag and drop to start organizing.' };

/** Loading skeleton, "nothing matches your filters", or the per-view empty message. */
export const FilesEmptyState = ({ activeNav, loading, filtered, onClearFilters }) => {
  if (loading) {
    return (
      <div role="status" aria-label="Loading files" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 44, borderRadius: 10 }} />
        ))}
      </div>
    );
  }

  const empty = filtered
    ? { title: 'No matching files', desc: 'Nothing matches your current search or filters.' }
    : EMPTY_BY_NAV[activeNav] || DEFAULT_EMPTY;
  const Icon = filtered ? SearchX : Cloud;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '64px 24px',
        gap: 8,
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
      }}
    >
      <Icon size={32} style={{ opacity: 0.4 }} aria-hidden="true" />
      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{empty.title}</div>
      <div style={{ fontSize: '0.8125rem' }}>{empty.desc}</div>
      {filtered && onClearFilters && (
        <button className="du-btn" style={{ marginTop: 8 }} onClick={onClearFilters}>
          Clear search &amp; filters
        </button>
      )}
    </div>
  );
};
