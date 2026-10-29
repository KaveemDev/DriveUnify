'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ease, springUI } from '@/lib/motion';
import { SpotCard } from '@/components/sections/PageShell';

const POSTS = [
  { id: 'dropbox', category: 'Product', date: 'Oct 13, 2026', read: '3 min', featured: true,
    title: 'Dropbox is here',
    excerpt: 'Your Dropbox now sits right next to your Google Drives — searchable, uploadable and ready for cross-drive copy.',
    body: ['Dropbox was the most requested provider by a mile. Connect it from “Connect Drive” and it joins the sidebar with its own storage bar.', 'Search covers it automatically, uploads can target it, and cross-drive copy works in both directions. Renaming and folder management are Google Drive only for now — they are next on the list.'] },
  { id: 'chunks', category: 'Engineering', date: 'Oct 13, 2026', read: '5 min',
    title: 'Copying big files in 8 MiB chunks',
    excerpt: 'How cross-drive copy moves large files between providers without ever touching your disk.',
    body: ['Drive-to-Drive is easy: we share the file with the destination account, let Google copy it server-side, then remove the share. Anything touching Dropbox has to travel through the browser.', 'We read the source in 8 MiB ranges and write each one to a resumable upload on the destination, holding just one chunk in memory at a time. If Google blocks a server-side copy, the same streaming path takes over automatically.'] },
  { id: 'sso', category: 'Engineering', date: 'Oct 28, 2026', read: '4 min',
    title: 'One sign-in for the site and the dashboard',
    excerpt: 'Sign in on driveunify.com and you are already signed in on the dashboard — and no more surprise “reconnect your drive” prompts.',
    body: ['The marketing site and the dashboard are separate apps on separate subdomains. A short-lived custom token minted by a Cloud Function now carries your session across.', 'We also stopped treating a slow token refresh as a dead connection, which is what caused drives to ask to be reconnected for no reason.'] },
  { id: 'landing', category: 'Design', date: 'Oct 28, 2026', read: '3 min',
    title: 'A home page that shows instead of tells',
    excerpt: 'The new landing page is a scroll-driven walkthrough of the real product.',
    body: ['Instead of screenshots, the new page rebuilds the dashboard in miniature and animates it as you scroll: search across drives, a file flying from Work Drive to Dropbox, storage filling up.', 'Every animation sticks to transform and opacity, and all of it turns off if you prefer reduced motion.'] },
  { id: 'two-apps', category: 'Engineering', date: 'Oct 11, 2026', read: '4 min',
    title: 'Why we split DriveUnify into two apps',
    excerpt: 'A Next.js site for pages people read, a Vite app for the dashboard people live in.',
    body: ['The site needs fast first loads and good SEO. The dashboard needs to feel instant after that. One app was compromising on both.', 'Splitting them let each use the right tool — at the cost of sharing a session across subdomains, which is its own story.'] },
  { id: 'palette', category: 'Product', date: 'Sep 24, 2026', read: '2 min',
    title: 'Meet the command palette',
    excerpt: 'Press ⌘K anywhere in the dashboard. Upload, create a folder, connect a drive or switch views without touching the mouse.',
    body: ['The redesign brought a rebuilt dashboard, cached account lists for instant loads, and the palette.', 'Arrow keys move, Enter runs, Esc closes. That’s the whole manual.'] },
  { id: 'stay-put', category: 'Thinking', date: 'May 24, 2026', read: '3 min',
    title: 'Your files should stay where they are',
    excerpt: 'Why DriveUnify is a window onto your drives, not another place to move them.',
    body: ['Most “unified storage” tools want you to sync everything into their cloud. That is just a sixth silo.', 'DriveUnify talks to Google Drive and Dropbox directly from your browser. Disconnect it tomorrow and every file is exactly where it was.'] },
];

const CATEGORIES = ['All', ...new Set(POSTS.map((p) => p.category))];

function Post({ post, open, onToggle, big }) {
  return (
    <motion.div layout transition={{ type: 'spring', ...springUI }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
      <SpotCard className={`h-full p-0 ${big ? 'bg-[#ffffff]' : ''}`}>
        <button onClick={onToggle} aria-expanded={open} className={`flex h-full w-full flex-col gap-4 text-left ${big ? 'p-8 md:p-12' : 'p-6'}`}>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-slate-500">
            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-blue-300">{post.category}</span>
            <span className="whitespace-nowrap">{post.date} · {post.read}</span>
          </span>
          <span className={`font-semibold tracking-[-0.02em] text-white ${big ? 'du-display text-[36px] md:text-[56px]' : 'text-[20px] leading-snug'}`}>{post.title}</span>
          <span className={`leading-[1.6] text-slate-400 ${big ? 'max-w-[640px] text-[18px]' : 'text-[15px]'}`}>{post.excerpt}</span>
          <AnimatePresence initial={false}>
            {open && (
              <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="block overflow-hidden">
                <span className={`flex flex-col gap-3 border-t border-white/[0.06] pt-4 leading-[1.7] text-slate-300 ${big ? 'max-w-[640px] text-[17px]' : 'text-[15px]'}`}>
                  {post.body.map((b) => <span key={b}>{b}</span>)}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
          <span className="mt-auto flex items-center gap-2 pt-2 text-[14px] text-blue-300">
            <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ type: 'spring', ...springUI }}><Plus size={16} /></motion.span>
            {open ? 'Show less' : 'Read more'}
          </span>
        </button>
      </SpotCard>
    </motion.div>
  );
}

export function BlogList() {
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(null);
  const featured = POSTS.find((p) => p.featured);
  const rest = POSTS.filter((p) => !p.featured && (cat === 'All' || p.category === cat));
  const toggle = (id) => setOpen((o) => (o === id ? null : id));

  return (
    <section aria-label="Posts" className="px-4 pb-28 md:px-8">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-12">
        <Post post={featured} big open={open === featured.id} onToggle={() => toggle(featured.id)} />
        <div className="flex flex-col gap-6">
          <div role="tablist" aria-label="Filter posts" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
                className={`relative rounded-full px-4 py-2 text-[14px] transition-colors ${cat === c ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                {cat === c && <motion.span layoutId="blog-cat" className="absolute inset-0 rounded-full border border-white/10 bg-slate-900" transition={{ type: 'spring', ...springUI }} />}
                <span className="relative">{c}</span>
              </button>
            ))}
          </div>
          <motion.div layout className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {rest.map((p) => <Post key={p.id} post={p} open={open === p.id} onToggle={() => toggle(p.id)} />)}
            </AnimatePresence>
          </motion.div>
          {!rest.length && <p className="text-[15px] text-slate-500">No other {cat.toLowerCase()} posts yet.</p>}
        </div>
      </div>
    </section>
  );
}
