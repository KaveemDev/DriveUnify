'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, LayoutGroup, useInView, useReducedMotion } from 'framer-motion';
import { Check, Layers } from 'lucide-react';
import { ease, springUI } from '@/lib/motion';
import { ACCOUNTS } from '@/components/mocks/data';
import { RevealHeading } from './shared';

// 12 chunks of an 11 GB file, each kept once on one drive; no drive has room for it alone.
const PLAN = ['personal', 'work', 'personal', 'work', 'personal', 'dropbox', 'personal', 'work', 'personal', 'work', 'personal', 'personal'];
const CHUNKS = PLAN.map((account, i) => ({ i, account, color: ACCOUNTS.find((a) => a.id === account).color }));

function Chunk({ c, stored, reduce }) {
  return (
    <motion.span
      layoutId={`chunk-${c.i}`}
      transition={reduce ? { duration: 0 } : { type: 'spring', ...springUI, delay: c.i * 0.06 }}
      className="relative grid h-7 w-7 place-items-center rounded-md text-[#fff]"
      style={{ background: c.color }}
    >
      {stored && (
        <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: reduce ? 0 : 0.5 + c.i * 0.06, duration: 0.25, ease }}>
          <Check size={13} strokeWidth={3} />
        </motion.span>
      )}
    </motion.span>
  );
}

export function SplitStorage() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [stored, setStored] = useState(false);

  // Play the split once on first view, then the visitor drives it.
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setStored(true), 600);
    return () => clearTimeout(t);
  }, [inView]);

  return (
    <section aria-labelledby="split-h" className="border-t border-white/[0.06] px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 md:grid-cols-[7fr_5fr] md:gap-16">
        <div ref={ref} className="order-2 rounded-2xl border border-white/[0.08] bg-slate-900 p-5 shadow-[0_40px_120px_rgba(35,72,216,0.12)] md:order-1 md:p-7">
          <LayoutGroup>
            <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.08] bg-slate-950 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/15 text-violet-500"><Layers size={18} /></span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-slate-200">family-videos-2026.zip</span>
                <span className="text-xs text-slate-400" aria-live="polite">11 GB · {stored ? 'Stored across 3 drives, every chunk verified' : 'Bigger than any single drive’s free space'}</span>
              </span>
            </div>

            <div aria-hidden="true" className="mt-3 flex min-h-[44px] flex-wrap gap-1.5 rounded-xl border border-dashed border-white/[0.12] p-2">
              {!stored && CHUNKS.map((c) => <Chunk key={c.i} c={c} stored={false} reduce={reduce} />)}
            </div>

            <ul className="mt-5 grid gap-2 sm:grid-cols-3">
              {ACCOUNTS.map((a) => (
                <li key={a.id} className="flex flex-col gap-2.5 rounded-xl border border-white/[0.08] bg-slate-950 p-3">
                  <span className="flex items-center gap-2 text-sm text-slate-200">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />{a.name}
                  </span>
                  <span className="text-xs text-slate-400">{(a.total - a.used).toFixed(1)} GB free</span>
                  <span aria-hidden="true" className="flex min-h-[28px] flex-wrap gap-1.5">
                    {stored && CHUNKS.filter((c) => c.account === a.id).map((c) => <Chunk key={c.i} c={c} stored reduce={reduce} />)}
                  </span>
                </li>
              ))}
            </ul>
          </LayoutGroup>

          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400">64 MB chunks · SHA-256 checked</span>
            <motion.button
              type="button"
              onClick={() => setStored((s) => !s)}
              whileTap={{ scale: 0.97 }}
              className="rounded-[10px] bg-blue-500 px-4 py-2.5 text-sm font-medium text-[#fff] hover:bg-blue-400"
            >
              {stored ? 'Download & reassemble' : 'Split & upload'}
            </motion.button>
          </div>
        </div>

        <div className="order-1 flex flex-col gap-5 md:order-2">
          <span className="w-fit rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-500">New · Unified Storage</span>
          <RevealHeading id="split-h" lines={['One file.', 'Many drives.']} />
          <p className="max-w-[420px] text-[17px] leading-[1.55] text-slate-400">
            Got a file bigger than the space left on any one account? DriveUnify splits it into chunks, spreads them across your connected drives and puts it back together when you download.
          </p>
          <p className="max-w-[420px] text-[15px] leading-[1.55] text-slate-400">
            Uploads pause and resume, and every chunk is verified. It’s not a backup: each chunk lives on one drive only.
          </p>
        </div>
      </div>
    </section>
  );
}
