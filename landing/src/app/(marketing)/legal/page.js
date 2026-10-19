import React from 'react';
import { SectionHeading } from '@/components/ui';

export const metadata = {
  title: 'Privacy Policy & Terms of Service',
  description: 'Understand how DriveUnify protects user privacy, token security, and handles Google OAuth scopes.',
};

export default function LegalPage() {
  return (
    <div className="container mx-auto px-4 max-w-3xl py-12">
      <SectionHeading
        badge="Legal & Trust"
        title="Privacy Policy & "
        gradientWord="Terms"
        subtitle="We design our architecture around user privacy and data security."
      />

      <div className="space-y-8 text-ink leading-relaxed text-sm">
        <div className="p-6 rounded-2xl bg-surface border border-line">
          <h3 className="text-lg font-bold text-ink mb-2">1. Privacy & Zero-Retention Architecture</h3>
          <p className="text-muted">
            DriveUnify operates as a direct client-to-API bridge. We do not store, copy, or read your file contents on our servers. File transfers and downloads stream directly between your browser and Google Drive&apos;s servers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-line">
          <h3 className="text-lg font-bold text-ink mb-2">2. Google OAuth Tokens & Scopes</h3>
          <p className="text-muted">
            DriveUnify requests only the scopes necessary to index and manage files in your connected drives. Long-lived refresh tokens are safeguarded in server-side encrypted Firestore collections protected by Firestore Security Rules that block client-side access.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-line">
          <h3 className="text-lg font-bold text-ink mb-2">3. Account Disconnection & Token Revocation</h3>
          <p className="text-muted">
            You can disconnect any Google account at any time from Settings or the sidebar. Disconnecting an account immediately calls Google’s revocation endpoint and purges all associated tokens from our database.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-line">
          <h3 className="text-lg font-bold text-ink mb-2">4. Contact & Data Protection Officer</h3>
          <p className="text-muted">
            If you have questions regarding privacy or data handling, reach out to our team at <a href="mailto:privacy@driveunify.com" className="text-brand hover:underline">privacy@driveunify.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
