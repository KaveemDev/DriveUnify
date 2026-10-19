'use client';
import { useState } from 'react';
import { Layers } from 'lucide-react';
import { accounts, files, fileIcons, formatSize } from './data';

// A working miniature of the dashboard: pick an account, the files follow.
export function AppWindow() {
  const [active, setActive] = useState('');
  const list = files.filter((f) => !active || f.account === active).slice(0, 9);
  const options = [{ name: '', label: 'All accounts', sub: `${accounts.length} connected` }, ...accounts.map((a) => ({ ...a, label: a.name, sub: a.email }))];

  return (
    <div id="app" className="scroll-grow grid md:grid-cols-[240px_1fr] min-h-[560px] overflow-hidden rounded-3xl bg-surface shadow-tinted" aria-label="DriveUnify, all accounts">
      <aside className="flex md:flex-col gap-1 overflow-x-auto bg-raised p-3 md:px-4 md:py-6">
        <p className="hidden md:block px-3 pb-2 text-[0.8125rem] font-bold text-muted">Accounts</p>
        {options.map((o) => (
          <button
            key={o.label}
            onClick={() => setActive(o.name)}
            aria-pressed={active === o.name}
            className="flex flex-none items-center gap-3 rounded-xl px-3 py-2.5 text-left text-ink transition-colors hover:bg-surface aria-pressed:bg-surface aria-pressed:font-bold cursor-pointer"
          >
            <span className="grid size-[30px] flex-none place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
              {o.name ? o.name[0] : <Layers size={14} />}
            </span>
            <span>
              {o.label}
              <small className="hidden md:block text-xs font-normal text-muted">{o.sub}</small>
            </span>
          </button>
        ))}
        <div className="hidden md:block mt-auto px-3 pt-4 text-[0.8125rem] text-muted">
          107.6 GB of 145 GB used
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full w-[74%] rounded-full bg-brand" />
          </div>
        </div>
      </aside>

      <div className="px-4 py-5 md:px-7 md:py-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-[1.375rem] font-bold tracking-[-0.02em] text-ink">{active || 'All accounts'}</h3>
          <span className="text-[0.9375rem] text-muted">{list.length} recent files</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(176px,1fr))]">
          {list.map((f) => {
            const Icon = fileIcons[f.type];
            return (
              <div key={f.name} className="flex min-w-0 flex-col gap-5 rounded-xl bg-page p-4 transition-transform duration-300 hover:-translate-y-0.5">
                <Icon size={26} className="text-brand" strokeWidth={1.75} />
                <div className="min-w-0">
                  <b className="block truncate text-[0.9375rem] font-medium text-ink">{f.name}</b>
                  <small className="text-[0.8125rem] text-muted">
                    {active ? f.modified : f.account} · {formatSize(f.mb)}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
