import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { FileRow } from './FileRow';
import { toggleFileSelection } from '../../store/slices/driveSlice';
import { openInGoogleDrive, downloadFile } from '../../utils/helpers';

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.025 } }
};

const TABS = ['View all', 'Documents', 'Spreadsheets', 'PDFs', 'Images'];

const getMimeCategory = (mimeType = '', category = '') => {
  if (!mimeType && !category) return 'other';
  const m = mimeType.toLowerCase();
  const c = category.toLowerCase();
  if (c === 'folder') return 'folder';
  if (m.includes('document') || m.includes('word') || c === 'document') return 'documents';
  if (m.includes('spreadsheet') || m.includes('excel') || c === 'spreadsheet') return 'spreadsheets';
  if (m.includes('pdf') || c === 'pdf') return 'pdfs';
  if (m.includes('image') || m.startsWith('image/') || c === 'image') return 'images';
  return 'other';
};

export const FileList = ({
  files, onFileClick, onContextMenu, onRename, onDelete,
}) => {
  const dispatch = useDispatch();
  const { selectedFiles, connectedAccounts } = useSelector(s => s.drive);
  const [activeTab, setActiveTab] = useState('View all');
  const [localSearch, setLocalSearch] = useState('');

  const [searchFocused, setSearchFocused] = useState(false);

  const getAccount = (email) => connectedAccounts?.find(a => a.email === email);

  const filtered = files.filter(file => {
    const category = getMimeCategory(file.mimeType, file.category);
    const tabMatch = activeTab === 'View all'
      || (activeTab === 'Documents'    && category === 'documents')
      || (activeTab === 'Spreadsheets' && category === 'spreadsheets')
      || (activeTab === 'PDFs'         && category === 'pdfs')
      || (activeTab === 'Images'       && category === 'images');
    const searchMatch = !localSearch
      || (file.name && file.name.toLowerCase().includes(localSearch.toLowerCase()))
      || (file.accountEmail && file.accountEmail.toLowerCase().includes(localSearch.toLowerCase()));
    return tabMatch && searchMatch;
  });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--color-bg-surface)',
    }}>
      {/* ── Filter bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px 8px',
        borderBottom: '1px solid var(--color-border)',
        overflowX: 'auto',
      }} className="scrollbar-thin">
        {/* Tabs */}
        <div className="filter-tabs" style={{ flex: 1, display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '2px' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ flexShrink: 0 }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <motion.div 
          initial={false}
          animate={{ width: searchFocused || localSearch ? 220 : 160 }}
          style={{ position: 'relative', flexShrink: 0 }}
        >
          <Search size={13} style={{
            position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
            color: searchFocused ? 'var(--color-text-primary)' : 'var(--color-text-muted)', 
            pointerEvents: 'none',
            transition: 'color 0.2s',
          }} />
          <input
            type="text"
            placeholder="Search files..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              padding: '6px 10px 6px 30px',
              width: '100%', borderRadius: 20,
              border: `1px solid ${searchFocused ? 'var(--color-border-strong)' : 'var(--color-border)'}`,
              background: searchFocused ? 'var(--color-bg-surface)' : 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              fontSize: '0.8rem', outline: 'none',
              transition: 'all 0.3s ease',
              boxShadow: searchFocused ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            }}
          />
        </motion.div>

        {/* Filters icon button */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', borderRadius: 20,
          border: '1px solid var(--color-border)',
          background: 'transparent', cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          fontSize: '0.8rem', fontWeight: 500,
          transition: 'background 130ms',
          flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <SlidersHorizontal size={13} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      {/* ── Column headers ── */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 16px',
        height: 36, borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
        flexShrink: 0,
      }}>
        {/* Checkbox placeholder */}
        <div style={{ width: 36, flexShrink: 0 }}>
          <div style={{
            width: 15, height: 15, borderRadius: 4,
            border: '1.5px solid var(--color-border-strong)',
            background: 'transparent',
          }} />
        </div>
        {/* Icon placeholder */}
        <div style={{ width: 28, flexShrink: 0 }} />
        {/* Name */}
        <div style={{ flex: 1, fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          File name
        </div>
        {/* Uploaded by */}
        <div style={{ width: 200, fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
             className="hidden md:block">
          Uploaded by
        </div>
        {/* Last modified */}
        <div style={{ width: 100, fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}
             className="hidden sm:block">
          Last modified
        </div>
        {/* Actions placeholder */}
        <div style={{ width: 36, flexShrink: 0 }} />
      </div>

      {/* ── Rows ── */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filtered.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '48px 24px', gap: 8,
            }}>
              <Search size={28} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                No files match "{localSearch || activeTab}"
              </div>
            </div>
          ) : (
            filtered.map(file => (
              <FileRow
                key={file.id + file.accountEmail}
                file={file}
                selected={selectedFiles.includes(file.id)}
                onSelect={() => dispatch(toggleFileSelection(file.id))}
                onClick={onFileClick}
                onContextMenu={onContextMenu}
                onRename={onRename}
                onDelete={onDelete}
                onDownload={(f) => {
                  const account = getAccount(f.accountEmail);
                  if (account) {
                    const url = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`;
                    downloadFile(url, f.name, account.accessToken);
                  }
                }}
                onOpenInDrive={(f) => openInGoogleDrive(f)}
              />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};
