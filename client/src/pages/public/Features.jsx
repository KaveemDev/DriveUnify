import React from 'react';
import { SectionHeading, GlassCard } from '../../components/ui';
import { Search, FolderOpen, Upload, RefreshCw, Layers, Eye } from 'lucide-react';

const features = [
  {
    icon: Layers,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
    title: 'Multi-Account Management',
    description: 'Connect multiple Google Drive accounts — personal, work, school — and switch between them instantly without logging out.',
  },
  {
    icon: Search,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    title: 'Unified Search',
    description: 'Search across all your connected Google Drive accounts simultaneously. Find any file by name, type, or date — in seconds.',
  },
  {
    icon: Upload,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
    title: 'Drag & Drop Upload',
    description: 'Drop files directly onto the dashboard to upload them to your selected Google Drive account. Supports multiple files at once.',
  },
  {
    icon: Eye,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    title: 'File Preview',
    description: 'Preview images, PDFs, and documents without leaving the app. Navigate through files using keyboard shortcuts.',
  },
  {
    icon: FolderOpen,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/15',
    title: 'Folder Navigation',
    description: 'Browse your full folder hierarchy with breadcrumb navigation. Open, rename, and delete files and folders with ease.',
  },
  {
    icon: RefreshCw,
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/15',
    title: 'Live Sync Refresh',
    description: 'Manually refresh your file list to fetch the latest changes from Google Drive. Your data is always up to date.',
  },
];

const Features = () => {
  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <SectionHeading
        badge="Features"
        title="Built for "
        highlight="real workflows."
        description="Everything you need to manage your Google Drive accounts from one clean, fast interface."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <GlassCard key={feature.title} delay={i * 0.05}>
              <div className={`w-12 h-12 rounded-xl ${feature.iconBg} ${feature.iconColor} flex items-center justify-center mb-5`}>
                <Icon size={22} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </GlassCard>
          );
        })}
      </div>

      {/* Roadmap teaser */}
      <div className="mt-16 p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
        <h3 className="text-xl font-bold text-white mb-3">More coming soon</h3>
        <p className="text-slate-400 max-w-xl mx-auto">
          We are actively working on support for additional cloud providers (Dropbox, OneDrive, Box) and advanced features like cross-account file moves, storage analytics, and team collaboration.
        </p>
      </div>
    </div>
  );
};

export default Features;
