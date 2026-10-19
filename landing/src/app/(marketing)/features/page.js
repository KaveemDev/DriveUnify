import React from 'react';
import { SectionHeading, GlassCard } from '@/components/ui';
import { Search, FolderOpen, Upload, RefreshCw, Layers, Eye, CopyPlus, FolderTree } from 'lucide-react';

export const metadata = {
  title: 'Features',
  description:
    'Discover what DriveUnify can do: unified multi-account search, direct cross-drive transfers, live preview, folder navigation, and instant drag-and-drop uploads.',
};

const features = [
  {
    icon: Layers,
    iconColor: 'text-brand',
    iconBg: 'bg-brand-soft',
    title: 'Multi-Account Management',
    description:
      'Connect multiple Google Drive accounts (personal, work, school) and switch between them instantly without logging out.',
  },
  {
    icon: Search,
    iconColor: 'text-brand',
    iconBg: 'bg-brand-soft',
    title: 'Unified Search',
    description:
      'Search across all your connected Google Drive accounts simultaneously. Find any file by name, type, or date in milliseconds.',
  },
  {
    icon: Upload,
    iconColor: 'text-brand',
    iconBg: 'bg-brand-soft',
    title: 'Drag & Drop Upload',
    description:
      'Drop files directly onto the dashboard to upload them to your selected Google Drive account. Supports batch uploading with progress indicators.',
  },
  {
    icon: Eye,
    iconColor: 'text-brand',
    iconBg: 'bg-brand-soft',
    title: 'Instant File Preview',
    description:
      'Preview images, PDFs, and text documents directly without leaving the application or switching browser tabs.',
  },
  {
    icon: FolderOpen,
    iconColor: 'text-brand',
    iconBg: 'bg-brand-soft',
    title: 'Folder Navigation & Breadcrumbs',
    description:
      'Browse your complete Google Drive folder hierarchy with responsive breadcrumbs. Open, rename, and manage folders easily.',
  },
  {
    icon: RefreshCw,
    iconColor: 'text-brand',
    iconBg: 'bg-brand-soft',
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
      <div className="mb-12 relative rounded-3xl border border-line bg-raised p-8 md:p-12 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
          <div className="flex-1">
            <div className="w-14 h-14 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-5">
              <CopyPlus size={28} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-ink mb-3">
              Cross-Drive Copy, Zero Download
            </h2>
            <p className="text-ink leading-relaxed max-w-lg mb-6">
              Move files and folders between your Google accounts directly in the cloud. Google copies Docs, Sheets, and Slides entirely on their servers, so zero bytes downloaded to your local computer.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-raised border border-line">
                <h4 className="font-semibold text-ink text-sm mb-1">Server-Side Transfer</h4>
                <p className="text-xs text-muted">Google Docs, Sheets, & Slides copy via Google&apos;s cloud APIs without using bandwidth.</p>
              </div>
              <div className="p-4 rounded-xl bg-raised border border-line">
                <h4 className="font-semibold text-ink text-sm mb-1">In-Memory Streaming</h4>
                <p className="text-xs text-muted">Binary files stream directly between drives with zero disk writes.</p>
              </div>
              <div className="p-4 rounded-xl bg-raised border border-line">
                <h4 className="font-semibold text-ink text-sm mb-1">Folder Hierarchy Copy</h4>
                <p className="text-xs text-muted">Copy entire folder structures recursively with live progress tracking.</p>
              </div>
              <div className="p-4 rounded-xl bg-raised border border-line">
                <h4 className="font-semibold text-ink text-sm mb-1">Direct Permissions</h4>
                <p className="text-xs text-muted">Target exact subfolders across any connected account safely.</p>
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
              <h3 className="text-xl font-semibold text-ink mb-2">{feat.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{feat.description}</p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
