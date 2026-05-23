import React, { useState } from 'react';
import { SectionHeading, GlassCard } from '../../components/ui';
import { Search, Book, MessageCircle, Video, ChevronDown, ChevronUp, CopyPlus, Zap } from 'lucide-react';

const faqs = [
  {
    q: 'How does "Copy to Drive" work without downloading?',
    a: (
      <span>
        There are two strategies depending on the file type:
        <br /><br />
        <strong className="text-slate-200">Google Docs, Sheets, Slides, and other Google Apps files</strong> — DriveUnify temporarily shares the file with your destination account, calls Google's <code className="bg-slate-800 px-1 rounded text-indigo-300 text-xs">files.copy</code> API using the destination account's token, then immediately removes the share. Google copies the file entirely on their servers — zero bytes travel through your browser.
        <br /><br />
        <strong className="text-slate-200">Binary files</strong> (PDFs, images, Office docs, etc.) — the file is downloaded into your browser's RAM and re-uploaded to the destination account via multipart upload. The file is never written to your local disk.
      </span>
    ),
  },
  {
    q: 'Can I copy entire folders between drives?',
    a: 'Yes! Right-click any folder and choose "Copy to Drive →". DriveUnify will recursively copy all files and subfolders, mirroring the exact folder structure in the destination drive. You\'ll see a live progress counter (e.g. "12 / 47 files copied") with the current filename displayed.',
  },
  {
    q: 'Can I choose where the file lands in the destination drive?',
    a: 'Yes — when the Copy to Drive modal opens, click "Browse folders" to open the inline folder picker. You can navigate into subfolders using the breadcrumb, click any folder to drill in, and click "Copy here" to select it as the destination.',
  },
  {
    q: 'Why does "Copy to Drive" only appear when I have 2+ accounts?',
    a: 'The feature requires at least two connected Google accounts — one source and one destination. If you only have one account connected, the option is hidden. Connect a second account via the sidebar to unlock it.',
  },
  {
    q: 'Will the original file be deleted after copying?',
    a: 'No — this is a copy operation, not a move. The original file stays in the source account unchanged. If you want to remove the original, you can delete it manually from the dashboard afterwards.',
  },
  {
    q: 'What happens if a file fails to copy?',
    a: "For single files, the modal shows an error message with details. For folder transfers, individual file errors are skipped (logged to the browser console) so one failed file doesn't abort the entire folder copy. The folder structure is always created regardless.",
  },
];

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-xl border transition-colors duration-200 ${open ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        {open ? (
          <ChevronUp size={16} className="text-indigo-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-4">
          {a}
        </div>
      )}
    </div>
  );
};

const HelpCenter = () => {
  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <SectionHeading
        badge="Support"
        title="How can we "
        highlight="help you?"
        description="Search our knowledge base or browse categories below to find what you need."
      />

      <div className="max-w-2xl mx-auto relative mb-16">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search for articles, guides, or troubleshooting..."
          className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus-ring text-lg"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <GlassCard className="text-center p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6"><Book size={32} /></div>
          <h3 className="text-xl font-bold text-white mb-2">Getting Started</h3>
          <p className="text-slate-400">Basic guides for setting up your DriveUnify account and connecting drives.</p>
        </GlassCard>
        <GlassCard className="text-center p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6"><Video size={32} /></div>
          <h3 className="text-xl font-bold text-white mb-2">Video Tutorials</h3>
          <p className="text-slate-400">Watch step-by-step videos on how to use advanced features.</p>
        </GlassCard>
        <GlassCard className="text-center p-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6"><MessageCircle size={32} /></div>
          <h3 className="text-xl font-bold text-white mb-2">Community</h3>
          <p className="text-slate-400">Join our Discord to ask questions and share workflows.</p>
        </GlassCard>
      </div>

      {/* ── Copy to Drive — Guide ── */}
      <div className="mb-12 rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/8 to-transparent p-7 md:p-9">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <CopyPlus size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-white">Copy to Drive Guide</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">New</span>
            </div>
            <p className="text-sm text-slate-400">Transfer files between Google accounts without downloading — directly from your browser.</p>
          </div>
        </div>

        {/* Quick steps */}
        <div className="grid sm:grid-cols-4 gap-3 mb-8">
          {[
            { num: '1', title: 'Connect 2+ accounts', desc: 'Add at least two Google Drive accounts in the sidebar.' },
            { num: '2', title: 'Right-click a file', desc: 'Click "Copy to Drive →" in the context menu.' },
            { num: '3', title: 'Pick destination', desc: 'Choose the target account and optionally browse to a subfolder.' },
            { num: '4', title: 'Done instantly', desc: 'The file appears in the other Drive — no download, no wait.' },
          ].map(({ num, title, desc }) => (
            <div key={num} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mb-3">{num}</div>
              <p className="text-sm font-semibold text-white mb-1">{title}</p>
              <p className="text-xs text-slate-400 leading-snug">{desc}</p>
            </div>
          ))}
        </div>

        {/* Pro tip */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-amber-500/20">
          <Zap size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300">
            <strong className="text-amber-300">Pro tip:</strong> Google Docs, Sheets, and Slides are copied entirely on Google's servers — not a single byte passes through your browser. For PDFs and other files, the data goes through browser RAM only and is never written to disk.
          </p>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
