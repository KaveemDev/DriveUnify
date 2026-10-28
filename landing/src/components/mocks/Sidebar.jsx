'use client';
import { motion } from 'framer-motion';
import { ACCOUNTS } from './data';
import { StorageBar } from './StorageBar';
import { springUI } from '@/lib/motion';

// `revealDelay` lets the hero pop accounts in one by one after the frame assembles.
export function Sidebar({ revealDelay = 0 }) {
  return (
    <div className="hidden w-[232px] shrink-0 flex-col gap-4 border-r border-white/[0.06] bg-[#0a101e] px-3.5 py-4 md:flex">
      <div className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Accounts</div>
      <div className="flex flex-col gap-1.5">
        {ACCOUNTS.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', ...springUI, delay: revealDelay + i * 0.12 }}
            className={`flex flex-col gap-1.5 rounded-lg p-2 ${i === 0 ? 'bg-blue-500/10' : ''}`}
          >
            <div className={`flex items-center gap-2 text-[13px] ${i === 0 ? 'text-white' : 'text-slate-300'}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
              {a.name}
            </div>
            <StorageBar value={a.used / a.total} color={a.color} delay={revealDelay + i * 0.12} />
            <div className="text-[11px] text-slate-400">{a.used} GB of {a.total} GB</div>
          </motion.div>
        ))}
      </div>
      <div className="mt-1.5 text-[11px] uppercase tracking-[0.06em] text-slate-400">Quick views</div>
      <div className="flex flex-col gap-2.5 text-[13px] text-slate-300">
        <span>Starred</span><span>Shared with me</span><span>Trash</span>
      </div>
    </div>
  );
}
