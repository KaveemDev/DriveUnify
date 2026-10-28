'use client';
import { Folder } from 'lucide-react';
import { accountById, TYPE_COLORS } from './data';

export function FileCard({ file }) {
  const account = accountById[file.account];
  return (
    <div className="flex flex-col gap-2.5 rounded-[10px] border border-white/[0.06] bg-slate-900 p-3">
      <div className="grid h-16 place-items-center rounded-md bg-slate-800 text-[11px] font-semibold" style={{ color: TYPE_COLORS[file.type] }}>
        {file.type === 'folder' ? <Folder size={22} strokeWidth={1.6} /> : file.type.toUpperCase()}
      </div>
      <div className="truncate text-xs text-slate-200">{file.name}</div>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: account.color }} />
        {account.short}
      </div>
    </div>
  );
}

export function FileGrid({ files, columns = 4 }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {files.map((f) => <FileCard key={f.name} file={f} />)}
    </div>
  );
}
