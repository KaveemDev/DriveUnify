'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, UploadCloud } from 'lucide-react';
import { ease, springUI } from '@/lib/motion';
import { RevealHeading } from '@/components/sections/shared';
import { SpotCard } from '@/components/sections/PageShell';
import { ACCOUNTS, FILES, accountById } from '@/components/mocks/data';
import { FileCard } from '@/components/mocks/FileGrid';
import { SearchBar } from '@/components/mocks/DashboardFrame';
import { CommandPalette } from '@/components/mocks/CommandPalette';
import { TransferAnimation } from '@/components/mocks/TransferAnimation';
import { StorageBar } from '@/components/mocks/StorageBar';

function BrowseDemo() {
  const [account, setAccount] = useState('all');
  const files = FILES.filter((f) => account === 'all' || f.account === account);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 text-[13px]">
        {[{ id: 'all', short: 'All drives', color: '#3b82f6' }, ...ACCOUNTS].map((a) => (
          <button key={a.id} onClick={() => setAccount(a.id)}
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${account === a.id ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
            {account === a.id && <motion.span layoutId="browse-chip" className="absolute inset-0 rounded-full bg-slate-800" transition={{ type: 'spring', ...springUI }} />}
            <span className="relative h-2 w-2 rounded-full" style={{ background: a.color }} />
            <span className="relative">{a.short}</span>
          </button>
        ))}
      </div>
      <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {files.map((f) => (
            <motion.div key={f.name} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.25, ease }}>
              <FileCard file={f} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SearchDemo() {
  const [q, setQ] = useState('pdf');
  const hits = FILES.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="flex flex-col gap-4">
      <label className="relative block">
        <span className="sr-only">Search the demo files</span>
        <SearchBar active value={<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “report” or “photos”" className="w-full bg-transparent text-white outline-none placeholder:text-slate-500" />} />
      </label>
      <ul className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {hits.map((f) => (
            <motion.li key={f.name} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2, ease }}
              className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-slate-900 px-3 py-2.5 text-[13px]">
              <span className="text-slate-200">{f.name}</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="h-1.5 w-1.5 rounded-full" style={{ background: accountById[f.account].color }} />{accountById[f.account].short}</span>
            </motion.li>
          ))}
        </AnimatePresence>
        {!hits.length && <li className="px-3 py-2.5 text-[13px] text-slate-500">Nothing in any drive matches “{q}”.</li>}
      </ul>
      <p className="text-[13px] text-slate-500">{hits.length} result{hits.length === 1 ? '' : 's'} across {ACCOUNTS.length} drives</p>
    </div>
  );
}

function CopyDemo() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <TransferAnimation key={run} />
      <button onClick={() => setRun((n) => n + 1)} className="flex w-fit items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[13px] text-slate-300 hover:border-blue-500/60 hover:text-white">
        <RotateCcw size={14} /> Copy again
      </button>
      <p className="text-[13px] leading-relaxed text-slate-500">Drive-to-Drive copies happen on Google’s servers. To or from Dropbox, files stream across in 8 MiB chunks, held in memory, never written to disk.</p>
    </div>
  );
}

function PaletteDemo() {
  const [active, setActive] = useState(0);
  const onKey = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    setActive((n) => (n + (e.key === 'ArrowDown' ? 1 : 3)) % 4);
  };
  return (
    <div className="flex flex-col items-start gap-4">
      <div tabIndex={0} aria-label="Command palette demo, use arrow keys" onKeyDown={onKey} className="w-full rounded-xl" onMouseMove={(e) => {
        const row = e.target.closest('[data-row]');
        if (row) setActive(Number(row.dataset.row));
      }}>
        <CommandPalette active={active} />
      </div>
      <p className="text-[13px] text-slate-500">Hover, or click it and use ↑ ↓. In the app, ⌘K / Ctrl K opens it from anywhere.</p>
    </div>
  );
}

function UploadDemo() {
  const [files, setFiles] = useState([]);
  const add = () => setFiles((f) => [...f, `scan-${f.length + 1}.pdf`].slice(-4));
  return (
    <div className="flex flex-col gap-4">
      <button onClick={add} className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 text-[14px] text-slate-400 transition-colors hover:border-blue-500/60 hover:bg-blue-500/5 hover:text-white">
        <UploadCloud size={22} /> Drop files here — or click to fake one
      </button>
      <ul className="flex flex-col gap-2">
        {files.map((name) => (
          <motion.li key={name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1.5 rounded-lg bg-slate-900 px-3 py-2.5 text-[13px] text-slate-300">
            <span className="flex justify-between">{name}<span className="text-slate-500">→ Work Drive</span></span>
            <div className="h-1 overflow-hidden rounded-full bg-slate-800">
              <motion.div className="h-full origin-left rounded-full bg-blue-500" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, ease }} />
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function StorageDemo() {
  const total = ACCOUNTS.reduce((s, a) => s + a.total, 0);
  const used = ACCOUNTS.reduce((s, a) => s + a.used, 0);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="du-display text-[44px] text-white">{used.toFixed(1)} <span className="text-[20px] text-slate-400">/ {total} GB</span></p>
        <p className="text-[13px] text-slate-500">Combined across every connected drive</p>
      </div>
      {ACCOUNTS.map((a, i) => (
        <div key={a.id} className="flex flex-col gap-2 text-[13px]">
          <span className="flex justify-between text-slate-300">{a.name}<span className="text-slate-500">{a.used} / {a.total} GB</span></span>
          <StorageBar value={a.used / a.total} color={a.color} height={6} delay={i * 0.1} />
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: 'browse', title: 'One file view', body: 'Every connected account in one grid. Filter by drive with a tap.', Demo: BrowseDemo },
  { id: 'search', title: 'Search everything', body: 'One query hits every drive at once. Type in the demo.', Demo: SearchDemo },
  { id: 'copy', title: 'Cross-drive copy', body: 'Work Drive to Dropbox without downloading a thing.', Demo: CopyDemo },
  { id: 'palette', title: 'Command palette', body: 'Upload, create, connect and switch views from the keyboard.', Demo: PaletteDemo },
  { id: 'upload', title: 'Drag-and-drop upload', body: 'Drop a batch, pick a drive, watch each file land.', Demo: UploadDemo },
  { id: 'storage', title: 'Storage at a glance', body: 'Per-account and combined usage, always current.', Demo: StorageDemo },
];

export function FeatureExplorer() {
  const [tab, setTab] = useState(TABS[0].id);
  const current = TABS.find((t) => t.id === tab);
  return (
    <section aria-labelledby="explore-h" className="px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1120px]">
        <RevealHeading id="explore-h" lines={['Don’t read about it.', 'Try it.']} className="mb-12" />
        <div className="grid gap-6 md:grid-cols-[5fr_7fr]">
          <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-1">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className="relative rounded-xl px-5 py-4 text-left">
                {tab === t.id && <motion.span layoutId="feature-tab" className="absolute inset-0 rounded-xl border border-white/[0.08] bg-slate-900" transition={{ type: 'spring', ...springUI }} />}
                <span className={`relative block text-[17px] font-medium transition-colors ${tab === t.id ? 'text-white' : 'text-slate-400'}`}>{t.title}</span>
                <AnimatePresence initial={false}>
                  {tab === t.id && (
                    <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}
                      className="relative block overflow-hidden text-[14px] leading-relaxed text-slate-400">
                      <span className="block pt-1.5">{t.body}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
          <SpotCard role="tabpanel" className="min-h-[460px] bg-[#0b1222] p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3, ease }}>
                <current.Demo />
              </motion.div>
            </AnimatePresence>
          </SpotCard>
        </div>
      </div>
    </section>
  );
}

const KEYS = [
  [['⌘', 'K'], 'Open the command palette', 'k'],
  [['↑', '↓'], 'Move through results', 'ArrowDown'],
  [['↵'], 'Run the highlighted command', 'Enter'],
  [['←', '→'], 'Previous / next file in preview', 'ArrowRight'],
  [['Space'], 'Play or pause video', ' '],
  [['Esc'], 'Close any panel', 'Escape'],
];
const SAME = { ArrowUp: 'ArrowDown', ArrowLeft: 'ArrowRight', K: 'k' };

export function Shortcuts() {
  const [pressed, setPressed] = useState(null);
  useEffect(() => {
    let t;
    const onKey = (e) => {
      setPressed(SAME[e.key] ?? e.key);
      clearTimeout(t);
      t = setTimeout(() => setPressed(null), 500);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, []);
  return (
    <section aria-labelledby="keys-h" className="border-t border-white/[0.06] bg-[#050b1a] px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1120px]">
        <RevealHeading id="keys-h" lines={['Hands stay', 'on the keyboard.']} className="mb-4" />
        <p className="mb-12 text-[17px] text-slate-400">Press any of these keys now — they light up.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {KEYS.map(([keys, label, code]) => (
            <motion.div key={label} animate={{ scale: pressed === code ? 1.03 : 1 }} transition={{ type: 'spring', ...springUI }}
              className={`flex items-center justify-between gap-4 rounded-xl border p-5 transition-colors ${pressed === code ? 'border-blue-500/60 bg-blue-500/10' : 'border-white/[0.06] bg-slate-900'}`}>
              <span className="text-[15px] text-slate-300">{label}</span>
              <span className="flex gap-1.5">
                {keys.map((k) => <kbd key={k} className="min-w-8 rounded-md border border-white/10 bg-slate-800 px-2 py-1 text-center font-sans text-[13px] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.4)]">{k}</kbd>)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
