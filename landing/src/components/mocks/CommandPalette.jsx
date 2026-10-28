'use client';
import { motion } from 'framer-motion';
import { springUI } from '@/lib/motion';

const ACTIONS = [
  ['Upload files', 'U'],
  ['New folder', 'N'],
  ['Connect a drive', 'C'],
  ['Switch to list view', 'L'],
];

export function CommandPalette({ active = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', ...springUI }}
      className="w-full max-w-[380px] overflow-hidden rounded-xl border border-white/[0.12] bg-slate-900/85 shadow-2xl shadow-black/50 backdrop-blur"
    >
      <div className="border-b border-white/[0.08] px-3.5 py-3 text-sm text-slate-400">Type a command…</div>
      <div className="relative flex flex-col gap-0.5 p-1.5 text-[13px]">
        {ACTIONS.map(([label, key], i) => (
          <div key={label} data-row={i} className={`relative flex justify-between rounded-md px-2.5 py-2.5 ${i === active ? 'text-white' : 'text-slate-300'}`}>
            {i === active && (
              <motion.span layoutId="palette-highlight" className="absolute inset-0 rounded-md bg-blue-500/20" transition={{ type: 'spring', ...springUI }} />
            )}
            <span className="relative">{label}</span>
            <span className={`relative ${i === active ? 'text-blue-200' : 'text-slate-400'}`}>{key}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
