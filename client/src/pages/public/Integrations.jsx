import React from 'react';
import { SectionHeading, GlassCard } from '../../components/ui';
import { Cloud } from 'lucide-react';

const integrations = [
  {
    name: 'Google Drive',
    status: 'available',
    desc: 'Full support: browse files and folders, upload, download, rename, delete, and preview — across multiple accounts.',
    color: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
  },
  {
    name: 'Dropbox',
    status: 'coming',
    desc: 'Dropbox integration is on the roadmap. You will be able to manage Dropbox files alongside your Google Drive.',
    color: 'text-slate-400',
    iconBg: 'bg-slate-700/30',
  },
  {
    name: 'OneDrive',
    status: 'coming',
    desc: 'Microsoft OneDrive support is planned. Connect your Microsoft 365 files to DriveUnify.',
    color: 'text-slate-400',
    iconBg: 'bg-slate-700/30',
  },
  {
    name: 'Box',
    status: 'coming',
    desc: 'Box integration is planned for enterprise customers who need secure file sharing and collaboration.',
    color: 'text-slate-400',
    iconBg: 'bg-slate-700/30',
  },
  {
    name: 'iCloud Drive',
    status: 'considering',
    desc: 'iCloud Drive access is being evaluated. Apple\'s API restrictions make this technically complex.',
    color: 'text-slate-400',
    iconBg: 'bg-slate-700/30',
  },
  {
    name: 'MEGA',
    status: 'considering',
    desc: 'MEGA integration is being researched. We are evaluating API capabilities and user demand.',
    color: 'text-slate-400',
    iconBg: 'bg-slate-700/30',
  },
];

const statusConfig = {
  available: { label: 'Available', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  coming: { label: 'Coming Soon', className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  considering: { label: 'Considering', className: 'bg-slate-700/50 text-slate-400 border border-slate-700' },
};

const Integrations = () => {
  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <SectionHeading
        badge="Integrations"
        title="Start with Google Drive. "
        highlight="More coming."
        description="DriveUnify currently supports Google Drive with full read and write access. Additional cloud providers are actively being developed."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
        {integrations.map((integration, i) => {
          const status = statusConfig[integration.status];
          return (
            <GlassCard key={integration.name} delay={i * 0.05} hoverEffect={integration.status === 'available'}>
              <div className="flex justify-between items-start mb-5">
                <div className={`w-12 h-12 rounded-xl ${integration.iconBg} flex items-center justify-center ${integration.color}`}>
                  <Cloud size={22} />
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <h3 className={`text-lg font-bold mb-2 ${integration.status === 'available' ? 'text-white' : 'text-slate-400'}`}>
                {integration.name}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">{integration.desc}</p>
            </GlassCard>
          );
        })}
      </div>

      <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-800/30">
        <h3 className="text-xl font-bold text-white mb-3">Want a specific integration prioritized?</h3>
        <p className="text-slate-400 mb-1">Let us know which cloud provider matters most to you.</p>
        <p className="text-slate-400 text-sm">Your feedback directly shapes our roadmap.</p>
      </div>
    </div>
  );
};

export default Integrations;
