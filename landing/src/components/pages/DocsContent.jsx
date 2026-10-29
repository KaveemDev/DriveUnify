'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Copy, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { ease, springUI } from '@/lib/motion';

function Code({ children }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#ffffff]">
      <button onClick={copy} aria-label="Copy code" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white">
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
      <pre className="overflow-x-auto p-5 pr-12 font-mono text-[13px] leading-relaxed text-slate-300">{children}</pre>
    </div>
  );
}

const P = ({ children }) => <p className="text-[16px] leading-[1.7] text-slate-400">{children}</p>;
const K = ({ children }) => <kbd className="rounded border border-white/10 bg-slate-800 px-1.5 py-0.5 font-sans text-[13px] text-white">{children}</kbd>;
const Steps = ({ items }) => (
  <ol className="flex flex-col gap-3">
    {items.map((s, i) => (
      <li key={i} className="flex gap-4 rounded-xl border border-white/[0.06] bg-slate-900 p-4 text-[15px] leading-[1.6] text-slate-300">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-500/15 text-[13px] text-blue-300">{i + 1}</span>
        <span>{s}</span>
      </li>
    ))}
  </ol>
);

const DOCS = [
  { id: 'quickstart', group: 'Getting started', title: 'Quick start', body: (
    <>
      <P>DriveUnify is free and runs in your browser. There is nothing to install.</P>
      <Steps items={[
        'Click “Open dashboard” and sign in with Google. This is your DriveUnify login.',
        'Choose “Connect Drive” and pick Google Drive or Dropbox.',
        'Approve access on the provider’s consent screen. The drive appears in the sidebar.',
        'Repeat for every account you own. Search, browse and copy across all of them.',
      ]} />
    </>
  ) },
  { id: 'google-drive', group: 'Getting started', title: 'Connecting Google Drive', body: (
    <>
      <P>You can connect any number of Google accounts — personal, Workspace or school. Each one asks for these scopes on Google’s consent screen:</P>
      <Code>{`https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/drive.metadata.readonly
https://www.googleapis.com/auth/userinfo.email`}</Code>
      <P>Full Drive access is what lets DriveUnify browse, rename, move and copy your existing files, not just ones it created. If your Workspace admin blocks third-party apps, ask them to allow DriveUnify.</P>
    </>
  ) },
  { id: 'dropbox', group: 'Getting started', title: 'Connecting Dropbox', body: (
    <>
      <P>Dropbox connects through Dropbox’s own OAuth flow. Once approved, its folders sit beside your Drives, show up in search, accept uploads and can be the source or target of a cross-drive copy.</P>
      <P>Renaming, deleting and creating folders are Google Drive only for now.</P>
    </>
  ) },
  { id: 'search', group: 'Using DriveUnify', title: 'Search & command palette', body: (
    <>
      <P>The search bar queries every connected account at once and tags each result with its drive. For everything else, open the command palette.</P>
      <ul className="flex flex-col gap-2 text-[15px] text-slate-300">
        <li><K>⌘</K> <K>K</K> / <K>Ctrl</K> <K>K</K> — open the command palette</li>
        <li><K>↑</K> <K>↓</K> then <K>↵</K> — pick and run a command</li>
        <li><K>←</K> <K>→</K> — previous / next file in preview</li>
        <li><K>Space</K> — play or pause video in preview</li>
        <li><K>Esc</K> — close any panel or menu</li>
      </ul>
    </>
  ) },
  { id: 'copy', group: 'Using DriveUnify', title: 'Cross-drive copy', body: (
    <>
      <P>Select files or a folder, choose “Copy to Drive”, then pick the destination account and folder.</P>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-[1.6] text-slate-400">
        <li><span className="text-slate-200">Google Drive → Google Drive</span> copies run on Google’s servers: the file is shared with the destination, copied, then the share is removed. Nothing is downloaded.</li>
        <li><span className="text-slate-200">To or from Dropbox</span> (or when Google blocks a server-side copy), files stream across in 8 MiB chunks held in memory, never written to disk.</li>
        <li><span className="text-slate-200">Folders</span> copy recursively with a live file count and progress.</li>
      </ul>
    </>
  ) },
  { id: 'upload', group: 'Using DriveUnify', title: 'Uploading files', body: (
    <P>Drag files anywhere onto the dashboard, or use Upload from the toolbar or ⌘K. Pick the target drive and each file gets its own progress row in the upload queue.</P>
  ) },
  { id: 'offline', group: 'Using DriveUnify', title: 'Going offline', body: (
    <P>DriveUnify notices when your connection drops and tells you. Your account list is cached locally, so the dashboard still opens; when you’re back online it refreshes from each provider.</P>
  ) },
  { id: 'tokens', group: 'Security', title: 'Tokens & OAuth', body: (
    <>
      <P>Refresh tokens are long-lived, so they never live in your browser. The flow goes through server-only Cloud Functions:</P>
      <Code>{`Browser (dashboard)
  ├── 1. Provider consent popup → authorization code
  ├── 2. exchangeGoogleCode / exchangeDropboxCode   (Cloud Function)
  │       └── refresh_token stored server-side only
  ├── 3. Browser receives a short-lived access_token
  └── 4. refresh*Token issues a new one when it expires`}</Code>
      <P>The browser then calls the Google Drive and Dropbox APIs directly with that short-lived token.</P>
    </>
  ) },
  { id: 'privacy', group: 'Security', title: 'Data & privacy', body: (
    <>
      <P>Your files stay in your own Google Drive and Dropbox. DriveUnify stores only what it needs to reconnect you: your login, the list of connected accounts and their tokens.</P>
      <P>Firestore security rules mean only you can read your connected-account list. Sign-in is handled by Firebase — we never see your password.</P>
    </>
  ) },
  { id: 'disconnect', group: 'Security', title: 'Disconnecting an account', body: (
    <P>Choose “Disconnect” on the account in the sidebar. DriveUnify revokes its token with the provider (revokeGoogleToken / revokeDropboxToken) and deletes the stored copy. Your files are untouched.</P>
  ) },
];

export function DocsBrowser() {
  const [id, setId] = useState(DOCS[0].id);
  const [q, setQ] = useState('');

  // Keep the open article in the URL hash so it can be linked.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (DOCS.some((d) => d.id === h)) setId(h);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);
  const open = (next) => {
    setId(next);
    history.replaceState(null, '', `#${next}`);
  };

  const shown = DOCS.filter((d) => d.title.toLowerCase().includes(q.toLowerCase()) || d.group.toLowerCase().includes(q.toLowerCase()));
  const groups = [...new Set(shown.map((d) => d.group))];
  const idx = DOCS.findIndex((d) => d.id === id);
  const doc = DOCS[idx];
  const prev = DOCS[idx - 1];
  const next = DOCS[idx + 1];

  return (
    <section aria-label="Documentation" className="px-4 pb-28 md:px-8">
      <div className="mx-auto grid max-w-[1120px] gap-10 md:grid-cols-[260px_1fr]">
        <nav aria-label="Docs" className="flex flex-col gap-6 md:sticky md:top-24 md:self-start">
          <label className="flex h-10 items-center gap-2.5 rounded-lg border border-white/[0.08] bg-slate-900 px-3 text-[14px] focus-within:border-blue-500/50">
            <Search size={14} className="text-slate-400" />
            <span className="sr-only">Filter docs</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter docs" className="w-full bg-transparent text-white outline-none placeholder:text-slate-500" />
          </label>
          {groups.map((g) => (
            <div key={g} className="flex flex-col gap-1">
              <h2 className="mb-1 px-3 text-[12px] font-medium uppercase tracking-[0.08em] text-slate-500">{g}</h2>
              {shown.filter((d) => d.group === g).map((d) => (
                <button key={d.id} onClick={() => open(d.id)} aria-current={id === d.id ? 'page' : undefined}
                  className={`relative rounded-lg px-3 py-2 text-left text-[14px] transition-colors ${id === d.id ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                  {id === d.id && <motion.span layoutId="docs-active" className="absolute inset-0 rounded-lg bg-slate-900 shadow-[inset_2px_0_0_#2348d8]" transition={{ type: 'spring', ...springUI }} />}
                  <span className="relative">{d.title}</span>
                </button>
              ))}
            </div>
          ))}
          {!shown.length && <p className="px-3 text-[14px] text-slate-500">No docs match “{q}”.</p>}
        </nav>
        <article className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease }} className="flex flex-col gap-6">
              <span className="text-[13px] text-blue-300">{doc.group}</span>
              <h2 className="du-display text-[36px] text-white md:text-[48px]">{doc.title}</h2>
              {doc.body}
            </motion.div>
          </AnimatePresence>
          <div className="mt-14 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-8">
            {prev ? (
              <button onClick={() => open(prev.id)} className="group flex flex-col items-start gap-1 rounded-xl border border-white/[0.06] p-4 text-left hover:border-white/15">
                <span className="flex items-center gap-1.5 text-[13px] text-slate-500"><ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />Previous</span>
                <span className="text-[15px] text-white">{prev.title}</span>
              </button>
            ) : <span />}
            {next && (
              <button onClick={() => open(next.id)} className="group flex flex-col items-end gap-1 rounded-xl border border-white/[0.06] p-4 text-right hover:border-white/15">
                <span className="flex items-center gap-1.5 text-[13px] text-slate-500">Next<ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" /></span>
                <span className="text-[15px] text-white">{next.title}</span>
              </button>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
