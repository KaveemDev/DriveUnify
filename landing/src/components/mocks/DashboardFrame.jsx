'use client';
import { Search } from 'lucide-react';

// Browser chrome + app shell. Children fill the main pane.
export function DashboardFrame({ sidebar, children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1222] ${className}`}>
      <div className="flex h-10 items-center gap-2 border-b border-white/[0.06] px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
        <div className="flex flex-1 justify-center">
          <span className="rounded-md bg-slate-900 px-10 py-1 text-xs text-slate-400">app.driveunify.com</span>
        </div>
      </div>
      <div className="flex min-h-[440px]">
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col gap-4 px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function SearchBar({ value, placeholder = 'Search all drives', active = false, cursor = false }) {
  return (
    <div className={`flex h-9 items-center gap-2.5 rounded-lg border bg-slate-900 px-3 text-[13px] ${active ? 'border-blue-500/50 text-white' : 'border-white/[0.06] text-slate-400'}`}>
      <Search size={14} className="text-slate-400" />
      {value || placeholder}
      {cursor && <span className="h-4 w-px animate-pulse bg-blue-500" />}
      {!active && <span className="ml-auto rounded border border-white/10 px-1.5 text-[11px]">⌘K</span>}
    </div>
  );
}
