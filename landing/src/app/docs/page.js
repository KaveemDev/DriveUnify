import React from 'react';
import { SectionHeading } from '@/components/ui';

export const metadata = {
  title: 'Documentation — DriveUnify',
  description:
    'Guides and documentation on connecting accounts, cross-drive copy, permissions, and managing your unified storage.',
};

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 max-w-5xl py-12">
      <SectionHeading
        badge="Documentation"
        title="Guides & "
        gradientWord="Architecture"
        subtitle="Learn how DriveUnify connects securely to your Google Drive accounts using official OAuth2 tokens."
      />
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
          <h4 className="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wider">Getting Started</h4>
          <ul className="space-y-2 mb-6 text-sm">
            <li className="text-blue-400 font-semibold cursor-pointer">Google OAuth Setup</li>
            <li className="text-slate-400 hover:text-slate-200 cursor-pointer">Connecting Accounts</li>
            <li className="text-slate-400 hover:text-slate-200 cursor-pointer">Cross-Drive Transfers</li>
          </ul>
          <h4 className="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wider">Security</h4>
          <ul className="space-y-2 text-sm">
            <li className="text-slate-400 hover:text-slate-200 cursor-pointer">Token Storage</li>
            <li className="text-slate-400 hover:text-slate-200 cursor-pointer">Data Privacy</li>
          </ul>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-slate-300">
            <h2 className="text-2xl font-bold text-white mb-3">Security & OAuth Token Architecture</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              DriveUnify follows strict least-privilege security principles. When you connect an account, Google authenticates you via OAuth 2.0. Long-lived refresh tokens are stored in secure server-only Firestore paths that the client cannot read directly.
            </p>

            <div className="rounded-xl overflow-hidden border border-slate-800 mb-8">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Architecture Overview</span>
              </div>
              <pre className="p-4 bg-[#0d1117] overflow-x-auto text-xs text-slate-300 leading-relaxed font-mono">
{`Browser App (dashboard.driveunify.com)
  ├── 1. Google OAuth Popup
  ├── 2. Auth Code sent to Cloud Function
  │       └── exchangeGoogleCode (server-only)
  ├── 3. Server securely stores refresh_token
  └── 4. Client receives short-lived access_token`}
              </pre>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Cross-Drive File Transfers</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              Google Workspace documents (Docs, Sheets, Slides) copy entirely via Google’s cloud servers without ever routing raw bytes to your machine. For other files, chunks stream in memory to prevent writing unencrypted files to temporary disk caches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
