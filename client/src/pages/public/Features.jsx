import React from 'react';
import { SectionHeading, GlassCard } from '../../components/ui';
import { Search, FolderOpen, Upload, RefreshCw, Layers, Eye, CopyPlus, FolderTree } from 'lucide-react';

const features = [
  {
    icon: Layers,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
    title: 'Multi-Account Management',
    description: 'Connect multiple Google Drive accounts — personal, work, school — and switch between them instantly without logging out.',
    badge: null,
  },
  {
    icon: Search,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
    title: 'Unified Search',
    description: 'Search across all your connected Google Drive accounts simultaneously. Find any file by name, type, or date — in seconds.',
    badge: null,
  },
  {
    icon: Upload,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
    title: 'Drag & Drop Upload',
    description: 'Drop files directly onto the dashboard to upload them to your selected Google Drive account. Supports multiple files at once.',
    badge: null,
  },
  {
    icon: Eye,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    title: 'File Preview',
    description: 'Preview images, PDFs, and documents without leaving the app. Navigate through files using keyboard shortcuts.',
    badge: null,
  },
  {
    icon: FolderOpen,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/15',
    title: 'Folder Navigation',
    description: 'Browse your full folder hierarchy with breadcrumb navigation. Open, rename, and delete files and folders with ease.',
    badge: null,
  },
  {
    icon: RefreshCw,
    iconColor: 'text-pink-400',
    iconBg: 'bg-pink-500/15',
    title: 'Live Sync Refresh',
    description: 'Manually refresh your file list to fetch the latest changes from Google Drive. Your data is always up to date.',
    badge: null,
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

      {/* ── Spotlight: Copy to Drive ── */}
      <div className="mb-8 relative rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-purple-500/8 p-7 md:p-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute top-4 right-5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">
            ✦ New
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start relative z-10">
          <div className="flex-1">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
              <CopyPlus size={28} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Copy to Drive — Zero Download
            </h2>
            <p className="text-slate-400 leading-relaxed max-w-lg mb-6">
              Move files and folders between your Google accounts directly inside the browser. No downloading, no uploading, no waiting. Google copies Docs, Sheets, and Slides entirely on their servers — nothing touches your device.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  icon: '⚡',
                  label: 'Server-side copy',
                  desc: 'Google Docs, Sheets & Slides copied on Google\'s infrastructure. Zero bytes in your browser.',
                },
                {
                  icon: '📦',
                  label: 'In-memory transfer',
                  desc: 'Binary files (PDFs, images, Office docs) pass through browser RAM only — never saved to disk.',
                },
                {
                  icon: '📁',
                  label: 'Recursive folder copy',
                  desc: 'Copy entire folder trees including all nested files and subfolders, with a live file counter.',
                },
                {
                  icon: '🗂️',
                  label: 'Folder destination picker',
                  desc: 'Browse the destination drive\'s folder hierarchy and choose exactly where to copy files.',
                },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                  <span className="text-xl leading-none mt-0.5 flex-shrink-0">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{label}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: How to use steps */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">How it works</p>
              <ol className="space-y-4">
                {[
                  { step: '01', text: 'Right-click any file or folder in your dashboard' },
                  { step: '02', text: 'Click "Copy to Drive →" in the context menu' },
                  { step: '03', text: 'Select the destination account and optionally browse to a subfolder' },
                  { step: '04', text: 'Click "Copy" — the file appears in the other Drive instantly' },
                ].map(({ step, text }) => (
                  <li key={step} className="flex gap-3">
                    <span className="text-xs font-mono font-bold text-indigo-400 w-7 flex-shrink-0 mt-0.5">{step}</span>
                    <p className="text-sm text-slate-300 leading-snug">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* ── All other features ── */}
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

      {/* Roadmap teaser — updated to remove cross-account moves since it's now live */}
      <div className="mt-16 p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
        <h3 className="text-xl font-bold text-white mb-3">More coming soon</h3>
        <p className="text-slate-400 max-w-xl mx-auto">
          We are actively working on support for additional cloud providers (Dropbox, OneDrive, Box) and advanced features like storage analytics, scheduled transfers, and team collaboration.
        </p>
      </div>
    </div>
  );
};

export default Features;
