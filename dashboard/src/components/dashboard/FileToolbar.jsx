import React, { useState } from 'react';
import { Search, ArrowUp, ArrowDown, LayoutGrid, List, Trash2, X, Check } from 'lucide-react';
import { FileBreadcrumb } from '../explorer/FileBreadcrumb';
import { VIEW_MODES, SORT_OPTIONS } from '../../config/constants';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'documents', label: 'Documents' },
  { id: 'spreadsheets', label: 'Spreadsheets' },
  { id: 'pdfs', label: 'PDFs' },
  { id: 'images', label: 'Images' },
  { id: 'starred', label: 'Starred' },
];

const SelectionBar = ({ selectedCount, totalCount, onSelectAll, onClearSelection, onBatchDelete }) => (
  <div
    role="toolbar"
    aria-label={`${selectedCount} selected`}
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 4,
      padding: '6px 6px 6px 14px',
      borderRadius: 12,
      background: 'var(--color-accent)',
      color: 'var(--color-accent-fg)',
    }}
  >
    <span style={{ fontSize: '0.875rem', fontWeight: 600, marginRight: 'auto' }}>
      {selectedCount} selected
    </span>
    {selectedCount < totalCount && (
      <button className="du-btn du-on-accent" onClick={onSelectAll}>
        <Check size={15} /> Select all {totalCount}
      </button>
    )}
    {onBatchDelete && (
      <button className="du-btn du-on-accent" onClick={onBatchDelete}>
        <Trash2 size={15} /> Move to trash
      </button>
    )}
    <button className="du-icon-btn du-on-accent" onClick={onClearSelection} aria-label="Clear selection" title="Clear selection">
      <X size={16} />
    </button>
  </div>
);

export const FileToolbar = ({
  onNavigateRoot,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  sortBy,
  sortDir,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onClearSelection,
  onBatchDelete,
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const currentSort = SORT_OPTIONS.find((o) => o.value === sortBy) || SORT_OPTIONS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Row 1: location + count, controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0, marginRight: 'auto' }}>
          <FileBreadcrumb onNavigateRoot={onNavigateRoot} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', justifyContent: 'flex-end', minWidth: 0 }}>
          <div style={{ position: 'relative', flex: '0 1 220px', minWidth: 120 }}>
            <Search size={14} aria-hidden="true" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
            <input
              type="search"
              aria-label="Filter this view"
              placeholder="Filter this view"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="du-input"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                aria-label="Clear filter"
                className="du-row-btn"
                style={{ position: 'absolute', right: 2, top: 2, width: 32, height: 32 }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              className="du-btn"
              onClick={() => setSortOpen(!sortOpen)}
              aria-haspopup="menu"
              aria-expanded={sortOpen}
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              <span className="hidden sm:inline">{currentSort.label}</span>
            </button>
            {sortOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setSortOpen(false)} />
                <div
                  role="menu"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 6px)',
                    zIndex: 50,
                    width: 180,
                    borderRadius: 12,
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-popup)',
                    padding: 4,
                  }}
                >
                  {SORT_OPTIONS.map((opt) => {
                    const active = sortBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => {
                          onSortChange(opt.value);
                          setSortOpen(false);
                        }}
                        className="hover:bg-[var(--color-bg-overlay)]"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          height: 36,
                          padding: '0 10px',
                          borderRadius: 7,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                          color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                          fontWeight: active ? 600 : 400,
                          textAlign: 'left',
                        }}
                      >
                        <span>{opt.label}</span>
                        {active && (sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div role="group" aria-label="View" className="du-seg">
            <button aria-label="List view" aria-pressed={viewMode === VIEW_MODES.LIST} onClick={() => onViewModeChange(VIEW_MODES.LIST)}>
              <List size={15} />
            </button>
            <button aria-label="Grid view" aria-pressed={viewMode === VIEW_MODES.GRID} onClick={() => onViewModeChange(VIEW_MODES.GRID)}>
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: selection bar replaces the type filters while items are selected */}
      {selectedCount > 0 ? (
        <SelectionBar
          selectedCount={selectedCount}
          totalCount={totalCount}
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
          onBatchDelete={onBatchDelete}
        />
      ) : (
        <div role="group" aria-label="Filter by type" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }} className="scrollbar-thin">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              className="du-chip"
              aria-pressed={activeFilter === tab.id}
              onClick={() => onFilterChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
