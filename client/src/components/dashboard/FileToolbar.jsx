import React, { useState } from 'react';
import {
  Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  LayoutGrid, List, CheckSquare, Square, Trash2, Download,
  FolderPlus, X, Star, FileText, Table2, FileType2, Image as ImageIcon
} from 'lucide-react';
import { FileBreadcrumb } from '../explorer/FileBreadcrumb';
import { VIEW_MODES, SORT_OPTIONS } from '../../config/constants';

const FILTER_TABS = [
  { id: 'all', label: 'All Files' },
  { id: 'documents', label: 'Documents' },
  { id: 'spreadsheets', label: 'Spreadsheets' },
  { id: 'pdfs', label: 'PDFs' },
  { id: 'images', label: 'Images' },
  { id: 'starred', label: 'Starred' },
];

export const FileToolbar = ({
  currentFolder,
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
  onCreateFolder,
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy) || SORT_OPTIONS[0];

  return (
    <div
      className="dashboard-filetoolbar-container"
      style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        flexShrink: 0,
      }}
    >
      {/* ── Top row: Breadcrumbs + Title + Action Count ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <FileBreadcrumb onNavigateRoot={onNavigateRoot} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            ({totalCount} {totalCount === 1 ? 'item' : 'items'})
          </span>
        </div>

        {/* Batch action bar when items are selected */}
        {selectedCount > 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-strong)',
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {selectedCount} selected
            </span>
            <div style={{ height: 12, width: 1, background: 'var(--color-border)' }} />
            <button
              onClick={onClearSelection}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <X size={12} />
              <span>Deselect</span>
            </button>
            {onBatchDelete && (
              <button
                onClick={onBatchDelete}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onCreateFolder}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background var(--transition-fast), color var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-overlay)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              <FolderPlus size={13} />
              <span>New folder</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom row: Category Tabs + Search + Sort + View Mode ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            overflowX: 'auto',
          }}
          className="scrollbar-thin"
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: isActive ? '1px solid var(--color-border-strong)' : '1px solid transparent',
                  background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--color-bg-overlay)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Controls: Search in view + Sort + Grid/List */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Quick in-view search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Filter current view…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: 170,
                padding: '5px 10px 5px 28px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text-primary)',
                fontSize: '0.78rem',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-border-strong)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 9px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span>{currentSort.label}</span>
            </button>

            {sortOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setSortOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 4px)',
                    zIndex: 50,
                    width: 160,
                    borderRadius: 8,
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-popup)',
                    padding: 4,
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onSortChange(opt.value);
                        setSortOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 5,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        color:
                          sortBy === opt.value
                            ? 'var(--color-text-primary)'
                            : 'var(--color-text-secondary)',
                        fontWeight: sortBy === opt.value ? 600 : 400,
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-overlay)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.value && (
                        <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div
            style={{
              display: 'flex',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              padding: 2,
              gap: 2,
            }}
          >
            <button
              onClick={() => onViewModeChange(VIEW_MODES.LIST)}
              title="List view"
              style={{
                width: 26,
                height: 26,
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === VIEW_MODES.LIST ? 'var(--color-bg-surface)' : 'transparent',
                color: viewMode === VIEW_MODES.LIST ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: viewMode === VIEW_MODES.LIST ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <List size={13} />
            </button>
            <button
              onClick={() => onViewModeChange(VIEW_MODES.GRID)}
              title="Grid view"
              style={{
                width: 26,
                height: 26,
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === VIEW_MODES.GRID ? 'var(--color-bg-surface)' : 'transparent',
                color: viewMode === VIEW_MODES.GRID ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: viewMode === VIEW_MODES.GRID ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
