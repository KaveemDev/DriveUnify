import React from 'react';
import { SectionHeading } from '@/components/ui';

export const metadata = {
  title: 'Documentation',
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
        <div className="w-full md:w-64 shrink-0 p-6 rounded-2xl border border-line bg-surface">
          <h4 className="text-xs font-bold text-ink mb-3">Getting Started</h4>
          <ul className="space-y-2 mb-6 text-sm">
            <li className="text-brand font-semibold cursor-pointer">Google OAuth Setup</li>
            <li className="text-muted hover:text-ink cursor-pointer">Connecting Accounts</li>
            <li className="text-muted hover:text-ink cursor-pointer">Cross-Drive Transfers</li>
          </ul>
          <h4 className="text-xs font-bold text-ink mb-3">Security</h4>
          <ul className="space-y-2 text-sm">
            <li className="text-muted hover:text-ink cursor-pointer">Token Storage</li>
            <li className="text-muted hover:text-ink cursor-pointer">Data Privacy</li>
          </ul>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-ink">
            <h2 className="text-2xl font-bold text-ink mb-3">Security & OAuth Token Architecture</h2>
            <p className="text-muted mb-6 leading-relaxed">
              DriveUnify follows strict least-privilege security principles. When you connect an account, Google authenticates you via OAuth 2.0. Long-lived refresh tokens are stored in secure server-only Firestore paths that the client cannot read directly.
            </p>

            <div className="rounded-xl overflow-hidden border border-line mb-8">
              <div className="bg-surface px-4 py-2 border-b border-line flex items-center justify-between">
                <span className="text-xs text-muted font-mono">Architecture Overview</span>
              </div>
              <pre className="p-4 bg-raised overflow-x-auto text-xs text-ink leading-relaxed font-mono">
{`Browser (driveunify.com)
  ├── 1. Google OAuth Popup
  ├── 2. Auth code sent to /api/oauth
  ├── 3. Server stores refresh_token in Firestore
  └── 4. Client receives a short-lived access_token`}
              </pre>
            </div>

            <h3 className="text-xl font-bold text-ink mb-2">Cross-Drive File Transfers</h3>
            <p className="text-muted leading-relaxed mb-4">
              Google Workspace documents (Docs, Sheets, Slides) copy entirely via Google’s cloud servers without ever routing raw bytes to your machine. For other files, chunks stream in memory to prevent writing unencrypted files to temporary disk caches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
