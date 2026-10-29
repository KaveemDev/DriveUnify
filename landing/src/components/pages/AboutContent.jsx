'use client';
import { useRef, useState } from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { ease, springScroll, clipReveal } from '@/lib/motion';
import { RevealHeading } from '@/components/sections/shared';
import { SpotCard } from '@/components/sections/PageShell';

export function Story() {
  return (
    <section aria-label="Why DriveUnify exists" className="px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-[1120px] gap-10 md:grid-cols-[5fr_7fr]">
        <p className="du-display text-[28px] leading-[1.15] text-white md:text-[40px]">Five Google accounts. One Dropbox. Zero idea where the file was.</p>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.8, ease }}
          className="flex flex-col gap-5 text-[17px] leading-[1.65] text-slate-400">
          <p>Work lives in one Drive, school in another, family photos in a third and the old stuff in Dropbox. Finding anything meant signing out, signing in, and opening yet another tab.</p>
          <p>DriveUnify puts every one of those accounts behind a single sign-in. You browse, search, upload and copy between them as if they were one drive — while the files themselves never leave the providers you already trust.</p>
        </motion.div>
      </div>
    </section>
  );
}

const PRINCIPLES = [
  ['Your files stay put', 'We don’t copy your drive into ours. The dashboard talks to Google and Dropbox directly from your browser.'],
  ['Not another silo', 'Disconnect any time and nothing is lost — every file is still exactly where it was.'],
  ['Fast is a feature', 'Cached account lists, parallel fetches and server-side copies keep the waiting to a minimum.'],
  ['Keyboard first', '⌘K for everything. Arrow keys in previews. Esc closes whatever is open.'],
];

export function Principles() {
  return (
    <section aria-labelledby="principles-h" className="border-t border-white/[0.06] bg-[#eceef3] px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1120px]">
        <RevealHeading id="principles-h" lines={['What we hold', 'ourselves to.']} className="mb-12" />
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid gap-4 md:grid-cols-2">
          {PRINCIPLES.map(([title, body], i) => (
            <motion.div key={title} variants={clipReveal} custom={i}>
              <SpotCard className="group flex h-full flex-col gap-3 p-8">
                <span className="text-[13px] text-slate-500 transition-colors group-hover:text-blue-400">0{i + 1}</span>
                <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-white">{title}</h3>
                <p className="text-[16px] leading-[1.6] text-slate-400">{body}</p>
              </SpotCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const MILESTONES = [
  ['May 2026', 'First version', 'Multiple Google Drive accounts in one dashboard, plus copying files between them.'],
  ['Jun 2026', 'Sharing', 'Copy share links and open files that others shared with you.'],
  ['Sep 2026', 'Redesign', 'A new modular dashboard, the ⌘K command palette and cached account lists for instant loads.'],
  ['Oct 2026', 'Two apps, one sign-in', 'The site and dashboard split into separate apps with single sign-on across both.'],
  ['Oct 2026', 'Dropbox arrives', 'Dropbox support and memory-safe 8 MiB chunked transfers between any two drives.'],
  ['Now', 'OneDrive', 'Microsoft OneDrive is the next provider on the bench.'],
];

export function Timeline() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(MILESTONES.length - 1);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });
  const fill = useSpring(scrollYProgress, springScroll);
  return (
    <section aria-labelledby="timeline-h" className="px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[820px]">
        <RevealHeading id="timeline-h" lines={['How we got here.']} className="mb-14" />
        <ol ref={ref} className="relative flex flex-col gap-2 pl-8">
          <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-800" />
          <motion.span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-px origin-top bg-blue-500" style={{ scaleY: reduce ? 1 : fill }} />
          {MILESTONES.map(([date, title, body], i) => (
            <li key={title} className="relative">
              <span aria-hidden="true" className={`absolute -left-8 top-6 h-[15px] w-[15px] rounded-full border-2 transition-colors ${active === i ? 'border-blue-400 bg-blue-500' : 'border-slate-700 bg-[#f5f6f8]'}`} />
              <button onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
                className={`w-full rounded-2xl border p-5 text-left transition-colors ${active === i ? 'border-white/10 bg-slate-900' : 'border-transparent'}`}>
                <span className="text-[13px] text-slate-500">{date}</span>
                <span className="block text-[20px] font-medium text-white">{title}</span>
                <motion.span initial={false} animate={{ opacity: active === i ? 1 : 0.55 }} className="mt-1 block text-[15px] leading-[1.6] text-slate-400">{body}</motion.span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
