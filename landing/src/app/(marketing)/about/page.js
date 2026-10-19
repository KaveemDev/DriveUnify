import React from 'react';
import { SectionHeading } from '@/components/ui';

export const metadata = {
  title: 'About Us',
  description:
    'Learn about DriveUnify mission to unify scattered cloud storage into one seamless, privacy-respecting productivity hub.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-12">
      <SectionHeading
        badge="Our Mission"
        title="Unifying the world's "
        gradientWord="scattered data."
        subtitle="We believe your digital workspace shouldn't be fragmented across dozens of disconnected tabs and accounts."
      />

      <div className="max-w-none text-ink">
        <p className="text-xl text-ink leading-relaxed mb-8">
          DriveUnify was born out of everyday frustration: spending more time switching Google accounts and hunting down spreadsheets than actually getting work done. We built DriveUnify to be the definitive abstraction layer for modern cloud storage.
        </p>

        <div className="grid md:grid-cols-2 gap-6 my-12">
          <div className="p-8 rounded-2xl bg-surface border border-line">
            <h3 className="text-2xl font-bold text-ink mb-3">Our Mission</h3>
            <p className="text-muted leading-relaxed">
              To build a fast, secure, and privacy-respecting control layer for personal and organizational cloud storage, enabling effortless file operations anywhere.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-surface border border-line">
            <h3 className="text-2xl font-bold text-ink mb-3">Our Vision</h3>
            <p className="text-muted leading-relaxed">
              A frictionless workflow where you never worry about which Google Drive account hosts your document. DriveUnify indexes, synchronizes, and presents everything in one view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
