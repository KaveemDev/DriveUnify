'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';
import { ease, springUI } from '@/lib/motion';
import { ACCOUNTS } from '@/components/mocks/data';
import { RevealHeading } from './shared';

// A fourth account starts disconnected so visitors can watch the pool grow when they add it.
const POOL = [...ACCOUNTS, { id: 'side', name: 'Side-project Drive', short: 'Side', color: '#4ade80', used: 3.4, total: 15 }];

// Tweens a number by writing text directly, like Speed's counter.
function Count({ value, digits = 1 }) {
  const ref = useRef(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: reduce ? 0 : 0.6,
      ease,
      onUpdate: (v) => { if (ref.current) ref.current.textContent = v.toFixed(digits); },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, digits, reduce]);
  return <span ref={ref} className="tabular-nums">{value.toFixed(digits)}</span>;
}

export function UnifiedStorage() {
  const [on, setOn] = useState({ work: true, personal: true, dropbox: true, side: false });
  const [hover, setHover] = useState(null);
  const live = POOL.filter((a) => on[a.id]);
  const used = live.reduce((s, a) => s + a.used, 0);
  const total = live.reduce((s, a) => s + a.total, 0);

  return (
    <section aria-labelledby="storage-h" className="px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 md:grid-cols-[5fr_7fr] md:gap-16">
        <div className="flex flex-col gap-5">
          <RevealHeading id="storage-h" lines={['Every account.', 'One storage pool.']} />
          <p className="max-w-[400px] text-[17px] leading-[1.55] text-slate-400">
            DriveUnify adds up the space across every connected Drive and Dropbox, so you always know how much room you really have. Toggle an account to see the pool change.
          </p>
          <p className="text-[15px] text-slate-300" aria-live="polite">
            <span className="du-display text-[44px] text-white"><Count value={total - used} /></span> GB free across {live.length} {live.length === 1 ? 'account' : 'accounts'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-slate-900 p-5 shadow-[0_40px_120px_rgba(35,72,216,0.12)] md:p-7">
          <div className="mb-3 flex items-baseline justify-between text-[13px] text-slate-400">
            <span>Combined storage</span>
            <span><span className="text-slate-200"><Count value={used} /> GB</span> of <Count value={total} digits={0} /> GB</span>
          </div>

          {/* Each segment's share of the pool; flex-basis changes are animated by framer's layout (transforms). */}
          <div aria-hidden="true" className="flex h-3.5 gap-[3px] overflow-hidden rounded-full bg-slate-800">
            {live.map((a) => (
              <motion.div
                key={a.id}
                layout
                transition={springUI}
                className="h-full first:rounded-l-full"
                style={{ flexBasis: `${(a.used / total) * 100}%`, background: a.color, opacity: hover && hover !== a.id ? 0.3 : 1 }}
              />
            ))}
          </div>

          <ul className="mt-6 flex flex-col gap-2">
            {POOL.map((a) => {
              const active = on[a.id];
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setOn((s) => (live.length === 1 && active ? s : { ...s, [a.id]: !active }))}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(a.id)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(a.id)}
                    onBlur={() => setHover(null)}
                    className={`flex w-full items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-colors ${active ? 'border-white/[0.08] bg-slate-950' : 'border-dashed border-white/[0.12] bg-transparent'}`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-[#fff]" style={{ background: a.color, opacity: active ? 1 : 0.35 }}>
                      {a.short[0]}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex items-baseline justify-between gap-3 text-sm">
                        <span className={active ? 'text-slate-200' : 'text-slate-500'}>{a.name}</span>
                        <span className="text-xs text-slate-400">{active ? `${a.used} / ${a.total} GB` : 'Not connected'}</span>
                      </span>
                      <span className="block h-1 overflow-hidden rounded-full bg-slate-800">
                        <motion.span
                          className="block h-full origin-left rounded-full"
                          style={{ background: a.color }}
                          initial={false}
                          animate={{ scaleX: active ? a.used / a.total : 0 }}
                          transition={{ duration: 0.5, ease }}
                        />
                      </span>
                    </span>
                    <span className={`text-xs font-medium ${active ? 'text-slate-400' : 'text-blue-500'}`}>{active ? 'On' : '+ Add'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
