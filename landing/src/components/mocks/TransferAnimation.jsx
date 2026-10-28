'use client';
import { motion } from 'framer-motion';
import { ease } from '@/lib/motion';

const PATH = 'M20 110 C 90 -10, 230 -10, 300 110';

// A file card lifts out of Work Drive, rides the curve into Dropbox, and a progress ring completes.
export function TransferAnimation() {
  return (
    <div className="relative flex h-[240px] items-end justify-between">
      <Panel color="#60a5fa" title="Work Drive" items={['Q3-report.pdf', 'client-assets/']} />
      <svg aria-hidden="true" className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2" width="320" height="130" viewBox="0 0 320 130" fill="none">
        <path d={PATH} stroke="#1e293b" strokeWidth="2" />
        <motion.path d={PATH} stroke="#3b82f6" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease }} />
      </svg>
      <motion.div
        className="absolute left-1/2 top-0 flex items-center gap-1.5 rounded-lg border border-blue-500/50 bg-slate-800 px-2.5 py-1.5 text-xs text-white shadow-xl shadow-blue-500/25"
        initial={{ x: -170, y: 110, opacity: 0 }}
        animate={{ x: [-170, -60, 40], y: [110, 0, 110], opacity: [0, 1, 0] }}
        transition={{ duration: 1.1, ease, times: [0, 0.5, 1] }}
      >
        <span className="text-[9px] font-bold text-green-400">XLS</span>budget-2026.xlsx
      </motion.div>
      <Panel color="#0061FF" title="Personal Dropbox" items={['invoices/']} ring />
    </div>
  );
}

function Panel({ color, title, items, ring }) {
  return (
    <div className="flex w-[150px] flex-col gap-2 rounded-[10px] border border-white/[0.08] bg-slate-900 p-3 text-xs text-slate-400">
      <span className="flex items-center gap-1.5 text-white"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{title}</span>
      {items.map((i) => <span key={i}>{i}</span>)}
      {ring && (
        <span className="flex items-center gap-2 text-slate-200">
          <svg width="16" height="16" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="4" />
            <motion.circle cx="18" cy="18" r="15" fill="none" stroke="#3b82f6" strokeWidth="4" transform="rotate(-90 18 18)"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease, delay: 0.9 }} />
          </svg>
          budget-2026.xlsx
        </span>
      )}
    </div>
  );
}
