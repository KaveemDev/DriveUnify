import React from 'react';
import { SectionHeading, GlassCard } from '@/components/ui';
import { Search, FolderOpen, Upload, RefreshCw, Layers, Eye, CopyPlus, FolderTree } from 'lucide-react';

export const metadata = {
  title: 'Features — DriveUnify',
  description:
    'Discover what DriveUnify can do: unified multi-account search, direct cross-drive transfers, live preview, folder navigation, and instant drag-and-drop uploads.',
};

const features = [
  {
    icon: Layers,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
    title: 'Multi-Account Management',
    description:
      'Connect multiple Google Drive accounts — personal, work, school — and switch between them instantly without logging out.',
  },
  {
    icon: Search,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    title: 'Unified Search',
    description:
      'Search across all your connected Google Drive accounts simultaneously. Find any file by name, type, or date in milliseconds.',
  },
  {
    icon: Upload,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
    title: 'Drag & Drop Upload',
    description:
      'Drop files directly onto the dashboard to upload them to your selected Google Drive account. Supports batch uploading with progress indicators.',
  },
  {
    icon: Eye,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    title: 'Instant File Preview',
    description:
      'Preview images, PDFs, and text documents directly without leaving the application or switching browser tabs.',
  },
  {
    icon: FolderOpen,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/15',
    title: 'Folder Navigation & Breadcrumbs',
    description:
      'Browse your complete Google Drive folder hierarchy with responsive breadcrumbs. Open, rename, and manage folders easily.',
  },
  {
    icon: RefreshCw,
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/15',
    title: 'Live Storage Sync',
    description:
      'Fetch the latest changes and storage updates directly from Google Drive APIs. Your files are always in sync.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <SectionHeading
        badge="Platform Capabilities"
        title="Built for modern"
        gradientWord="cloud productivity."
        subtitle="Everything you need to manage all your Google Drive accounts from one unified, beautiful, and secure interface."
      />

      {/* Spotlight: Copy to Drive */}
      <div className="mb-12 relative rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-slate-900/80 to-purple-500/10 p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
          <div className="flex-1">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
              <CopyPlus size={28} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
              Cross-Drive Copy — Zero Download
            </h2>
            <p className="text-slate-300 leading-relaxed max-w-lg mb-6">
              Move files and folders between your Google accounts directly in the cloud. Google copies Docs, Sheets, and Slides entirely on their high-speed servers — zero bytes downloaded to your local computer.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-xl mb-1 block">⚡</span>
                <h4 className="font-semibold text-white text-sm mb-1">Server-Side Transfer</h4>
                <p className="text-xs text-slate-400">Google Docs, Sheets, & Slides copy via Google&apos;s cloud APIs without using bandwidth.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-xl mb-1 block">📦</span>
                <h4 className="font-semibold text-white text-sm mb-1">In-Memory Streaming</h4>
                <p className="text-xs text-slate-400">Binary files stream directly between drives with zero disk writes.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-xl mb-1 block">📁</span>
                <h4 className="font-semibold text-white text-sm mb-1">Folder Hierarchy Copy</h4>
                <p className="text-xs text-slate-400">Copy entire folder structures recursively with live progress tracking.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-xl mb-1 block">🔒</span>
                <h4 className="font-semibold text-white text-sm mb-1">Direct Permissions</h4>
                <p className="text-xs text-slate-400">Target exact subfolders across any connected account safely.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <GlassCard key={feat.title} className="flex flex-col">
              <div className={`w-12 h-12 rounded-xl ${feat.iconBg} ${feat.iconColor} flex items-center justify-center mb-5`}>
                <Icon size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.description}</p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
