'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { ease, springScroll, springUI } from '@/lib/motion';
import { SearchBar } from '@/components/mocks/DashboardFrame';
import { CommandPalette } from '@/components/mocks/CommandPalette';
import { TransferAnimation } from '@/components/mocks/TransferAnimation';
import { accountById, TYPE_COLORS } from '@/components/mocks/data';

const FEATURES = [
  { title: 'Search every account at once', body: 'Type once. Results come back from every connected drive, tagged with where they live. Sort by name, date, size or type.' },
  { title: '⌘K for everything', body: 'Upload, create a folder, connect a drive or switch to list view without touching the mouse.' },
  { title: 'Move files between accounts', body: 'Pick a file or folder, pick a target account and folder. Move or copy, no download-and-reupload.' },
  { title: 'Uploads that survive bad Wi-Fi', body: 'Drag files in. Anything over 5 MB uploads in resumable chunks, up to 5 GB per file.' },
  { title: 'Preview without leaving', body: 'Images, video, PDFs and Google Docs open right in the app.' },
];

const RESULTS = [
  { name: 'wedding-photos/', type: 'folder', account: 'personal' },
  { name: 'wedding-budget.xlsx', type: 'xlsx', account: 'work' },
  { name: 'wedding-speech-draft.docx', type: 'docx', account: 'dropbox' },
];

function SearchState() {
  const query = 'wedd';
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (typed >= query.length) return;
    const t = setTimeout(() => setTyped((n) => n + 1), 140);
    return () => clearTimeout(t);
  }, [typed]);
  return (
    <div className="flex flex-col gap-2.5">
      <SearchBar value={query.slice(0, typed)} active cursor />
      <div className="text-xs text-slate-400">{typed === query.length ? '3 results across 3 accounts' : 'Searching all drives…'}</div>
      {typed === query.length && RESULTS.map((r, i) => {
        const a = accountById[r.account];
        return (
          <motion.div key={r.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease, delay: i * 0.07 }}
            className="flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-3 text-sm text-slate-200">
            <span className="w-8 text-[10px] font-bold" style={{ color: TYPE_COLORS[r.type] }}>{r.type === 'folder' ? 'DIR' : r.type.toUpperCase().slice(0, 3)}</span>
            {r.name}
            <span className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] text-slate-100" style={{ background: `${a.color}33` }}>{a.short}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function PaletteState() {
  const [row, setRow] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRow((r) => (r + 1) % 4), 900);
    return () => clearInterval(t);
  }, []);
  return <div className="grid min-h-[260px] place-items-center"><CommandPalette active={row} /></div>;
}

function UploadState() {
  const [chunks, setChunks] = useState(0);
  useEffect(() => {
    if (chunks >= 10) return;
    const t = setTimeout(() => setChunks((c) => c + 1), chunks === 0 ? 700 : 220);
    return () => clearTimeout(t);
  }, [chunks]);
  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative grid h-[180px] place-items-center rounded-[10px] border-[1.5px] border-dashed border-blue-500 bg-blue-500/[0.08] text-[13px] text-blue-200">
        <motion.div aria-hidden="true" className="absolute inset-0 rounded-[10px] shadow-[inset_0_0_40px_rgba(59,130,246,0.25)]" animate={{ opacity: [0, 1, 0.6] }} transition={{ duration: 1.2 }} />
        <motion.span initial={{ x: 80, y: -60, rotate: 8, opacity: 0 }} animate={{ x: 0, y: 0, rotate: 0, opacity: [0, 1, 0] }} transition={{ duration: 0.7, ease }}
          className="absolute rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-xl">raw-footage-day2.mov</motion.span>
        Drop to upload to Work Drive
      </div>
      <div className="flex justify-between text-xs text-slate-300"><span>raw-footage-day2.mov · 2.2 GB</span><span className="text-slate-400">chunk {chunks} / 10</span></div>
      <div className="grid grid-cols-10 gap-[3px]">
        {Array.from({ length: 10 }, (_, i) => (
          <motion.span key={i} className="h-1.5 origin-left rounded-sm bg-blue-500" initial={{ scaleX: 0 }} animate={{ scaleX: i < chunks ? 1 : 0 }} transition={{ duration: 0.2 }} />
        ))}
      </div>
    </div>
  );
}

function PreviewState() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <LayoutGroup>
      <div className="relative grid min-h-[260px] place-items-center">
        {!open ? (
          <motion.div layoutId="preview-card" className="flex w-[150px] flex-col gap-2 rounded-[10px] border border-white/[0.06] bg-slate-900 p-3">
            <div className="grid h-16 place-items-center rounded-md bg-slate-800 text-[11px] font-semibold text-red-400">PDF</div>
            <div className="text-xs text-slate-200">Q3-report.pdf</div>
          </motion.div>
        ) : (
          <motion.div layoutId="preview-card" transition={{ type: 'spring', ...springUI }} className="w-full max-w-[420px] overflow-hidden rounded-xl border border-white/[0.12] bg-slate-900">
            <div className="flex items-center gap-2.5 border-b border-white/[0.08] px-3.5 py-2.5 text-[13px] text-white">
              <span className="text-[9px] font-bold text-red-400">PDF</span>Q3-report.pdf<span className="ml-auto text-xs text-slate-400">Open in Drive</span>
            </div>
            <div className="flex justify-center bg-slate-800 p-5">
              <div className="flex h-[150px] w-[190px] flex-col gap-1.5 rounded-sm bg-slate-50 p-4">
                <span className="h-2 w-[70%] rounded-sm bg-slate-900" />
                <span className="h-1 rounded-sm bg-slate-300" /><span className="h-1 rounded-sm bg-slate-300" /><span className="h-1 w-4/5 rounded-sm bg-slate-300" />
                <span className="mt-auto h-10 rounded-sm bg-blue-200" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </LayoutGroup>
  );
}

const STATES = [SearchState, PaletteState, TransferAnimation, UploadState, PreviewState];

export function FeatureShowcase() {
  const listRef = useRef(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start center', 'end center'] });
  const line = useSpring(scrollYProgress, springScroll);
  const State = STATES[active];
  const [seen, setSeen] = useState([]);

  return (
    <section id="features" aria-labelledby="features-h" className="px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto grid max-w-[1120px] gap-16 md:grid-cols-2">
        <div className="flex gap-7">
          <div aria-hidden="true" className="relative hidden w-0.5 shrink-0 rounded-full bg-slate-800 md:block">
            <motion.div className="absolute inset-0 origin-top rounded-full bg-blue-500" style={{ scaleY: reduce ? 1 : line }} />
          </div>
          <div ref={listRef} className="flex flex-col">
            <h2 id="features-h" className="du-display mb-10 text-[36px] text-white md:mb-0 md:text-[56px]">Built for people with too many drives.</h2>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                onViewportEnter={() => { setActive(i); setSeen((s) => (s.includes(i) ? s : [...s, i])); }}
                viewport={{ amount: 0.6 }}
                className="flex flex-col justify-center gap-2.5 py-10 md:min-h-[70vh] md:py-0"
              >
                <h3 className={`text-2xl font-semibold tracking-[-0.02em] transition-colors duration-300 ${active === i ? 'text-white' : 'text-slate-500'}`}>{f.title}</h3>
                <p className="text-[17px] leading-[1.55] text-slate-400">{f.body}</p>
                <div aria-hidden="true" className="mt-4 min-h-[300px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1222] p-4 md:hidden">
                  {seen.includes(i) && (() => { const S = STATES[i]; return <motion.div initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: 0.3 }}><S /></motion.div>; })()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="hidden md:block">
          <div className="sticky top-[20vh] min-h-[340px] rounded-2xl border border-white/[0.08] bg-[#0b1222] p-5">
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(6px)' }} transition={{ duration: 0.3 }}>
                <State />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
