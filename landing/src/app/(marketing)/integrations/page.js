import React from 'react';
import { SectionHeading, GlassCard } from '@/components/ui';
import { Cloud } from 'lucide-react';

export const metadata = {
  title: 'Cloud Integrations — DriveUnify',
  description:
    'DriveUnify connects with Google Drive today with full multi-account sync, with Microsoft OneDrive, Dropbox, Box, and more on our immediate roadmap.',
};

const integrations = [
  {
    name: 'Google Drive',
    status: 'available',
    desc: 'Full production support: browse, search, upload, download, preview, star, and deep-copy across multiple personal and workspace accounts.',
    color: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
  },
  {
    name: 'Microsoft OneDrive',
    status: 'coming',
    desc: 'Connect your personal Microsoft OneDrive and Office 365 business accounts to manage all spreadsheets, slides, and files in one hub.',
    color: 'text-sky-400',
    iconBg: 'bg-sky-500/15',
  },
  {
    name: 'Dropbox',
    status: 'coming',
    desc: 'Sync Dropbox folders alongside your Google Drive hierarchy with unified universal search.',
    color: 'text-indigo-400',
    iconBg: 'bg-indigo-500/15',
  },
  {
    name: 'Box',
    status: 'coming',
    desc: 'Enterprise Box cloud integration for high-security team workspaces and collaboration.',
    color: 'text-slate-400',
    iconBg: 'bg-slate-700/30',
  },
  {
    name: 'iCloud Drive',
    status: 'considering',
    desc: 'Currently in evaluation for Apple ecosystem storage management.',
    color: 'text-slate-400',
    iconBg: 'bg-slate-700/30',
  },
  {
    name: 'MEGA',
    status: 'considering',
    desc: 'Encrypted storage integration under user feedback research.',
    color: 'text-slate-400',
    iconBg: 'bg-slate-700/30',
  },
];

const statusConfig = {
  available: { label: 'Available Now', className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  coming: { label: 'In Development', className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  considering: { label: 'Evaluating', className: 'bg-slate-700/50 text-slate-400 border border-slate-700' },
};

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <SectionHeading
        badge="Ecosystem"
        title="Start with Google Drive. "
        gradientWord="Expand everywhere."
        subtitle="DriveUnify currently supports Google Drive with full multi-account read and write access. Additional cloud providers are actively in development."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
        {integrations.map((integration) => {
          const status = statusConfig[integration.status];
          return (
            <GlassCard key={integration.name} hoverEffect={integration.status === 'available'}>
              <div className="flex justify-between items-start mb-5">
                <div className={`w-12 h-12 rounded-xl ${integration.iconBg} flex items-center justify-center ${integration.color}`}>
                  <Cloud size={24} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${integration.status === 'available' ? 'text-white' : 'text-slate-300'}`}>
                {integration.name}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{integration.desc}</p>
            </GlassCard>
          );
        })}
      </div>

      <div className="text-center p-8 rounded-3xl bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-800/30 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-2">Need a specific provider integration?</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          We prioritize roadmap integrations based on user votes. Contact our team to request custom integrations.
        </p>
      </div>
    </div>
  );
}
