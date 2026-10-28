'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { ease, springUI } from '@/lib/motion';
import { SpotCard } from '@/components/sections/PageShell';

const FAQS = [
  ['Accounts', 'Which drives can I connect?', 'Google Drive (personal, Workspace and school accounts) and Dropbox. Connect as many of each as you like. OneDrive is next.'],
  ['Accounts', 'Does my login account have to be a drive I connect?', 'No. The Google account you sign in with is just your DriveUnify login. Connect whichever drives you want from “Connect Drive”.'],
  ['Accounts', 'A drive keeps asking me to reconnect. What do I do?', 'Choose “Disconnect” on that account in the sidebar, then connect it again. If it’s a Workspace account, your admin may have blocked third-party apps.'],
  ['Copying', 'How does “Copy to Drive” work without downloading?', 'Between two Google accounts, DriveUnify shares the file with the destination, asks Google to copy it on its own servers, then removes the share. To or from Dropbox, the file streams across in 8 MiB chunks held only in memory.'],
  ['Copying', 'Can I copy whole folders?', 'Yes. Right-click a folder and choose “Copy to Drive”. Every subfolder and file is recreated at the destination with a live progress count.'],
  ['Copying', 'Can I pick the destination folder?', 'Yes. The copy dialog has a folder browser for the destination account — drill in and choose where it lands.'],
  ['Copying', 'Why is “Copy to Drive” greyed out?', 'Copying needs a source and a destination, so it unlocks once you have at least two drives connected.'],
  ['Copying', 'Is the original file changed or deleted?', 'No. It’s a copy. The source stays exactly as it was.'],
  ['Privacy', 'Are my files stored on DriveUnify servers?', 'No. Your browser talks to Google Drive and Dropbox directly. We store your login, your list of connected accounts and their tokens — never file contents.'],
  ['Privacy', 'How do I remove DriveUnify’s access?', 'Choose “Disconnect” on the account. We revoke the token with Google or Dropbox and delete our copy. You can also revoke access from your Google or Dropbox security settings.'],
];
const TOPICS = ['All', ...new Set(FAQS.map(([t]) => t))];

export function FaqList() {
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('All');
  const [open, setOpen] = useState(null);
  const needle = q.toLowerCase();
  const shown = FAQS.filter(([t, question, a]) => (topic === 'All' || t === topic) && (question + a).toLowerCase().includes(needle));

  return (
    <section aria-label="Frequently asked questions" className="px-4 pb-24 md:px-8">
      <div className="mx-auto flex max-w-[820px] flex-col gap-6">
        <label className="flex h-14 items-center gap-3 rounded-xl border border-white/[0.08] bg-slate-900 px-4 text-[16px] focus-within:border-blue-500/50">
          <Search size={18} className="text-slate-400" />
          <span className="sr-only">Search help</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions — try “Dropbox” or “folder”" className="w-full bg-transparent text-white outline-none placeholder:text-slate-500" />
        </label>
        <div role="tablist" aria-label="Topics" className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button key={t} role="tab" aria-selected={topic === t} onClick={() => setTopic(t)}
              className={`relative rounded-full px-4 py-2 text-[14px] transition-colors ${topic === t ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
              {topic === t && <motion.span layoutId="help-topic" className="absolute inset-0 rounded-full border border-white/10 bg-slate-900" transition={{ type: 'spring', ...springUI }} />}
              <span className="relative">{t}</span>
            </button>
          ))}
        </div>
        <motion.ul layout className="flex flex-col gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map(([t, question, a]) => (
              <motion.li key={question} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease }}>
                <SpotCard className={`p-0 transition-colors ${open === question ? 'border-blue-500/40' : ''}`}>
                  <button onClick={() => setOpen((o) => (o === question ? null : question))} aria-expanded={open === question} className="flex w-full flex-col p-5 text-left md:p-6">
                    <span className="flex items-center justify-between gap-4">
                      <span className="text-[17px] font-medium text-white">{question}</span>
                      <motion.span animate={{ rotate: open === question ? 45 : 0 }} transition={{ type: 'spring', ...springUI }} className="text-slate-400"><Plus size={18} /></motion.span>
                    </span>
                    <AnimatePresence initial={false}>
                      {open === question && (
                        <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="block overflow-hidden">
                          <span className="block pt-3 text-[15px] leading-[1.7] text-slate-400">{a}</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </SpotCard>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
        {!shown.length && (
          <p className="text-[15px] text-slate-400">No answers match “{q}”. <Link href="/contact" className="du-link text-blue-300">Ask us directly →</Link></p>
        )}
      </div>
    </section>
  );
}

export function HelpLinks() {
  const links = [
    ['/docs', 'Read the docs', 'Step-by-step guides for connecting, copying and security.'],
    ['/contact', 'Contact support', 'Still stuck? Send us a message.'],
  ];
  return (
    <section className="px-4 pb-28 md:px-8">
      <div className="mx-auto grid max-w-[820px] gap-4 md:grid-cols-2">
        {links.map(([href, title, body]) => (
          <Link key={href} href={href} className="group">
            <SpotCard className="flex h-full flex-col gap-2 p-6 transition-colors group-hover:border-white/15">
              <span className="text-[18px] font-medium text-white">{title} <span className="inline-block transition-transform group-hover:translate-x-1">→</span></span>
              <span className="text-[15px] text-slate-400">{body}</span>
            </SpotCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
