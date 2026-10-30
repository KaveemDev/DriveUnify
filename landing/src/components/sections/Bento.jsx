'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clipReveal, ease, springUI } from '@/lib/motion';
import { RevealHeading } from './shared';

// Radial spotlight that follows the cursor inside the tile (CSS vars --x/--y, see landing.css).
function Tile({ i, className = '', children, onHover }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
  };
  const tapped = useRef(false);
  const onTap = (e) => {
    if (e.pointerType === 'mouse' || !onHover) return;
    tapped.current = !tapped.current;
    onHover(tapped.current);
  };
  return (
    <motion.div
      variants={clipReveal}
      custom={i}
      onMouseMove={onMove}
      onPointerUp={onTap}
      onHoverStart={() => onHover?.(true)}
      onHoverEnd={() => onHover?.(false)}
      className={`du-spot flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-slate-900 p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

const DONUT = [
  { label: 'Video', gb: 8.0, color: '#2348d8' },
  { label: 'Images', gb: 5.1, color: '#93c5fd' },
  { label: 'Documents', gb: 3.3, color: '#f59e0b' },
  { label: 'Other', gb: 1.8, color: '#dfe2ea' },
];
const DONUT_TOTAL = DONUT.reduce((s, d) => s + d.gb, 0);
const ARCS = DONUT.map((d, i) => ({ ...d, len: d.gb / DONUT_TOTAL, start: DONUT.slice(0, i).reduce((s, x) => s + x.gb, 0) / DONUT_TOTAL }));

function StorageTile() {
  const [k, setK] = useState(0);
  return (
    <Tile i={0} className="p-7 md:col-span-3 md:row-span-2" onHover={(h) => h && setK((n) => n + 1)}>
      <h3 className="text-xl font-semibold text-white">See what&apos;s eating your space</h3>
      <p className="text-[15px] text-slate-400">Per-account and combined storage, broken down by file type.</p>
      <div className="mt-auto flex flex-wrap items-center gap-8">
        <svg key={k} width="160" height="160" viewBox="0 0 42 42" role="img" aria-label="Storage by file type" className="-rotate-90">
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#dfe2ea" strokeWidth="5" />
          {ARCS.map(({ label, color, len, start }) => (
            <motion.circle key={label} cx="21" cy="21" r="15.9" fill="none" stroke={color} strokeWidth="5"
              initial={{ pathLength: 0, pathOffset: start }} whileInView={{ pathLength: len - 0.01, pathOffset: start }}
              viewport={{ once: true }} transition={{ duration: 0.9, ease, delay: start * 0.6 }} />
          ))}
        </svg>
        <ul className="flex flex-col gap-2.5 text-[13px] text-slate-300">
          {DONUT.map((d) => (
            <li key={d.label} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: d.color }} />{d.label} · {d.gb} GB</li>
          ))}
        </ul>
      </div>
    </Tile>
  );
}

function OfflineTile() {
  const [hover, setHover] = useState(false);
  return (
    <Tile i={2} className="md:col-span-2" onHover={setHover}>
      <h3 className="text-lg font-semibold text-white">Offline aware</h3>
      <div className="relative h-10 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {hover ? (
            <motion.div key="online" initial={{ y: -40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ duration: 0.3, ease, delay: 0.6 }}
              className="rounded-lg bg-green-400/10 px-3 py-2.5 text-[13px] text-green-200">Back online</motion.div>
          ) : (
            <motion.div key="offline" initial={{ y: -40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ duration: 0.3, ease }}
              className="rounded-lg bg-amber-500/10 px-3 py-2.5 text-[13px] text-amber-200">You&apos;re offline. Changes will sync.</motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tile>
  );
}

function GridListTile() {
  const [list, setList] = useState(false);
  return (
    <Tile i={3} className="md:col-span-1" onHover={setList}>
      <h3 className="text-lg font-semibold text-white">Grid ⇄ List</h3>
      <div className={list ? 'flex flex-col gap-1.5' : 'grid grid-cols-2 gap-1.5'}>
        {[0, 1, 2, 3].map((n) => (
          <motion.span layout key={n} transition={{ type: 'spring', ...springUI }} className={`rounded ${list ? 'h-3' : 'h-7'} ${n === 2 ? 'bg-blue-500' : 'bg-slate-800'}`} />
        ))}
      </div>
    </Tile>
  );
}

export function Bento() {
  return (
    <section aria-labelledby="bento-h" className="px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1120px]">
        <RevealHeading id="bento-h" lines={['And the small things', 'you’d miss.']} className="mb-12" />
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <StorageTile />
          <Tile i={1} className="md:col-span-3">
            <h3 className="text-lg font-semibold text-white">Starred, Shared, Trash</h3>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <span className="rounded-full bg-blue-500 px-3 py-1.5 text-[#fff]">Starred</span>
              <span className="rounded-full bg-slate-800 px-3 py-1.5 text-slate-300">Shared with me</span>
              <span className="rounded-full bg-slate-800 px-3 py-1.5 text-slate-300">Trash</span>
            </div>
          </Tile>
          <OfflineTile />
          <GridListTile />
          <Tile i={4} className="flex-row flex-wrap items-center md:col-span-6">
            <h3 className="flex-[1_1_240px] text-lg font-semibold text-white">Rename, share, copy link, open in Drive</h3>
            <div className="flex flex-wrap gap-2 text-[13px] text-slate-300">
              {['Rename', 'Share', 'Copy link', 'Star', 'Open in Drive'].map((a) => (
                <span key={a} className="rounded-lg border border-white/10 px-3 py-2 transition-colors hover:border-blue-500/60 hover:text-white">{a}</span>
              ))}
            </div>
          </Tile>
        </motion.div>
      </div>
    </section>
  );
}
