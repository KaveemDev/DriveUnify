'use client';
import React, { useState } from 'react';
import { SectionHeading } from '@/components/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    q: 'How does "Copy to Drive" work without downloading?',
    a: (
      <span>
        There are two strategies depending on the file type:
        <br /><br />
        <strong className="text-white">Google Docs, Sheets, Slides</strong> — DriveUnify temporarily shares the file with your destination account, calls Google's <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300 text-xs">files.copy</code> API, and revokes the share. Google executes the copy on their infrastructure — zero bytes travel through your device.
        <br /><br />
        <strong className="text-white">Binary files (PDFs, images, archives)</strong> — The file streams in browser memory and uploads directly to the destination drive without writing to local disk.
      </span>
    ),
  },
  {
    q: 'Can I copy entire folders between drives?',
    a: 'Yes! Right-click any folder and select "Copy to Drive". DriveUnify recursively copies all subdirectories and files, recreating the directory hierarchy in the target Google account with live progress counters.',
  },
  {
    q: 'Can I choose the destination subfolder?',
    a: 'Yes. When the transfer modal opens, use the built-in folder navigator to drill down into any folder on the destination account and select "Copy here".',
  },
  {
    q: 'Why does "Copy to Drive" require 2+ accounts?',
    a: 'The cross-drive transfer requires both a source and a destination account. Once you connect a second Google account in the sidebar, the feature unlocks automatically.',
  },
  {
    q: 'Will the original file be modified or deleted?',
    a: 'No. This is a copy operation. The source document remains untouched in its original account.',
  },
  {
    q: 'Are my files stored on DriveUnify servers?',
    a: 'Never. DriveUnify communicates directly with Google Drive APIs using client credentials. We do not store, view, or cache your file contents on our servers.',
  },
];

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border transition-colors ${
        open ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
      }`}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-base font-semibold text-white">{q}</span>
        {open ? <ChevronUp size={18} className="text-indigo-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>
      {open && (
        <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4">
          {a}
        </div>
      )}
    </div>
  );
};

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 max-w-4xl py-12">
      <SectionHeading
        badge="FAQ & Support"
        title="Frequently asked "
        gradientWord="questions."
        subtitle="Common questions about account connections, cross-drive copy, storage limits, and security."
      />
      <div className="space-y-4">
        {faqs.map((faq) => (
          <FaqItem key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </div>
    </div>
  );
}
