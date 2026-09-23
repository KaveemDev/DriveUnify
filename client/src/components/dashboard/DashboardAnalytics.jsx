import React, { useMemo } from 'react';
import {
  FileText,
  Image,
  Video,
  FileSpreadsheet,
  FileCode,
  HardDrive,
  TrendingUp,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

const CATEGORY_COLORS = {
  documents: { label: 'Documents', color: '#3B82F6', icon: FileText },
  images: { label: 'Images', color: '#10B981', icon: Image },
  videos: { label: 'Videos & Media', color: '#8B5CF6', icon: Video },
  spreadsheets: { label: 'Spreadsheets', color: '#F59E0B', icon: FileSpreadsheet },
  code: { label: 'Code & Data', color: '#EC4899', icon: FileCode },
  other: { label: 'Other Files', color: '#6B7280', icon: HardDrive },
};

const getCategoryKey = (mime = '', name = '') => {
  const m = (mime || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (m.includes('video') || n.match(/\.(mp4|mkv|mov|avi|webm)$/)) return 'videos';
  if (m.includes('image') || n.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'images';
  if (m.includes('spreadsheet') || m.includes('excel') || m.includes('csv') || n.match(/\.(xlsx|xls|csv)$/)) return 'spreadsheets';
  if (m.includes('document') || m.includes('pdf') || m.includes('word') || n.match(/\.(pdf|doc|docx|txt|md)$/)) return 'documents';
  if (m.includes('json') || m.includes('javascript') || m.includes('html') || n.match(/\.(js|jsx|ts|tsx|py|json|html|css)$/)) return 'code';
  return 'other';
};

export const DashboardAnalytics = ({ files = [], connectedAccounts = [] }) => {
  const analytics = useMemo(() => {
    let totalSize = 0;
    let starredCount = 0;
    let sharedCount = 0;
    let folderCount = 0;
    const catMap = {
      documents: { count: 0, size: 0 },
      images: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      spreadsheets: { count: 0, size: 0 },
      code: { count: 0, size: 0 },
      other: { count: 0, size: 0 },
    };

    files.forEach((f) => {
      if (f.trashed) return;
      if (f.mimeType === 'application/vnd.google-apps.folder' || f.isFolder) {
        folderCount += 1;
        return;
      }
      const sz = Number(f.size) || 0;
      totalSize += sz;
      if (f.starred) starredCount += 1;
      if (f.shared) sharedCount += 1;

      const cat = getCategoryKey(f.mimeType, f.name);
      catMap[cat].count += 1;
      catMap[cat].size += sz;
    });

    const categoriesWithData = Object.entries(catMap)
      .map(([k, v]) => ({
        key: k,
        ...CATEGORY_COLORS[k],
        count: v.count,
        size: v.size,
        percent: totalSize > 0 ? Math.round((v.size / totalSize) * 100) : (files.length > 0 ? Math.round((v.count / files.length) * 100) : 0),
      }))
      .filter((c) => c.count > 0 || c.size > 0);

    return {
      totalFiles: files.filter((f) => !f.trashed && f.mimeType !== 'application/vnd.google-apps.folder').length,
      totalFolders: folderCount,
      totalSize,
      starredCount,
      sharedCount,
      categories: categoriesWithData,
    };
  }, [files]);

  return (
    <section
      className="dashboard-analytics-section"
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--color-accent, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={13} />
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            Analytics & Storage
          </h2>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
          {connectedAccounts.length} active {connectedAccounts.length === 1 ? 'drive' : 'drives'}
        </span>
      </div>

      {/* KPI Cards Grid: 2 columns on mobile, fluid on desktop */}
      <div
        className="analytics-kpi-grid"
        style={{
          display: 'grid',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {/* KPI 1: Total Indexed Files */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Indexed Files
            </span>
            <FileText size={14} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            {analytics.totalFiles}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
            Across {analytics.totalFolders} organized folders
          </span>
        </div>

        {/* KPI 2: Total Managed Volume */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Managed Size
            </span>
            <HardDrive size={14} style={{ color: '#10B981' }} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            {formatFileSize(analytics.totalSize)}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
            Total calculated payload
          </span>
        </div>

        {/* KPI 3: Starred & Priority */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Flagged Priority
            </span>
            <Sparkles size={14} style={{ color: '#F59E0B' }} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            {analytics.starredCount}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
            Starred for rapid lookup
          </span>
        </div>

        {/* KPI 4: Shared Collaborations */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Shared Files
            </span>
            <PieChart size={14} style={{ color: '#8B5CF6' }} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            {analytics.sharedCount}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
            Collaborative cloud assets
          </span>
        </div>
      </div>

      {/* Multi-Bar Category Distribution */}
      {analytics.categories.length > 0 && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: '0.73rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ fontWeight: 600 }}>File Type Distribution</span>
            <span>{analytics.categories.length} active formats detected</span>
          </div>

          {/* Segmented Progress Strip */}
          <div
            style={{
              height: 7,
              width: '100%',
              borderRadius: 99,
              background: 'var(--color-bg-base)',
              overflow: 'hidden',
              display: 'flex',
              gap: 2,
              marginBottom: 10,
            }}
          >
            {analytics.categories.map((cat) => (
              <div
                key={cat.key}
                style={{
                  width: `${Math.max(cat.percent, 3)}%`,
                  height: '100%',
                  background: cat.color,
                  transition: 'width 0.4s ease',
                }}
                title={`${cat.label}: ${cat.count} files (${cat.percent}%)`}
              />
            ))}
          </div>

          {/* Legend Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
            }}
          >
            {analytics.categories.map((cat) => (
              <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: cat.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  {cat.label}
                </span>
                <span style={{ opacity: 0.7 }}>
                  ({cat.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
