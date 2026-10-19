'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const plans = [
  ['Free Google account', 15],
  ['Workspace Starter', 30],
  ['Google One 100 GB', 100],
  ['Google One 2 TB', 2048],
];
const names = ['Work', 'Personal', 'School', 'Side project', 'Old university', 'Family'];
const fmt = (gb) => (gb >= 1024 ? `${(gb / 1024).toFixed(1).replace('.0', '')} TB` : `${gb} GB`);

export function StorageCalculator() {
  const [rows, setRows] = useState([['Work', 30], ['Personal', 100], ['School', 15]]);
  const total = rows.reduce((sum, [, gb]) => sum + gb, 0);

  const setPlan = (i, gb) => setRows((r) => r.map((row, j) => (j === i ? [row[0], gb] : row)));
  const remove = (i) => setRows((r) => r.filter((_, j) => j !== i));
  const add = () => {
    const name = names.find((n) => !rows.some(([r]) => r === n));
    if (name) setRows((r) => [...r, [name, 15]]);
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[6fr_5fr] items-start">
      <div>
        <h2 id="calc-h" className="text-[clamp(2.25rem,1.4rem+2.8vw,3.75rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink">
          How much room do you really have?
        </h2>
        <p className="mt-4 max-w-[50ch] text-[1.1875rem] text-muted">
          Add the Google accounts you use. DriveUnify shows their space as one total.
        </p>
        <div className="mt-9 grid gap-2.5">
          {rows.map(([name, gb], i) => (
            <div key={name} className="grid grid-cols-[36px_1fr_40px] md:grid-cols-[36px_1fr_220px_40px] items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-brand">{name[0]}</span>
              <label htmlFor={`plan-${i}`} className="font-medium text-ink">{name}</label>
              <select
                id={`plan-${i}`}
                value={gb}
                onChange={(e) => setPlan(i, Number(e.target.value))}
                className="col-span-3 row-start-2 md:col-span-1 md:row-start-auto h-10 rounded-xl border border-line bg-page px-3 text-ink"
              >
                {plans.map(([label, v]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
              <button
                onClick={() => remove(i)}
                disabled={rows.length === 1}
                aria-label={`Remove ${name}`}
                className="col-start-3 row-start-1 md:col-start-auto md:row-start-auto grid size-10 place-items-center rounded-xl text-muted hover:bg-raised hover:text-ink disabled:opacity-40 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={add}
          disabled={rows.length >= names.length}
          className="mt-3 inline-flex h-[52px] items-center gap-2.5 rounded-full bg-raised px-6 font-bold text-ink transition-transform hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-40 cursor-pointer"
        >
          <Plus size={18} />
          Add an account
        </button>
      </div>

      <div className="rounded-3xl bg-surface p-7 md:p-10 lg:sticky lg:top-24" aria-live="polite">
        <div className="text-[clamp(3.5rem,2rem+4vw,6rem)] font-black leading-none tracking-[-0.05em] tabular-nums text-ink">{fmt(total)}</div>
        <p className="mt-2 text-muted">across {rows.length} Google account{rows.length === 1 ? '' : 's'}</p>
        <div className="mt-8 flex h-[18px] gap-1">
          {rows.map(([name, gb], i) => (
            <i key={name} className="block h-full rounded-md bg-brand" style={{ flexGrow: gb, opacity: 1 - i * 0.14 }} />
          ))}
        </div>
        <p className="mt-6 text-[0.9375rem] text-ink">
          {total > 15 ? `That is ${fmt(total - 15)} more than one free Google account.` : 'Add another account to see them combined.'}
        </p>
      </div>
    </div>
  );
}
