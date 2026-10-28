'use client';
import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { ease } from '@/lib/motion';
import { ACCOUNTS } from '@/components/mocks/data';

const NAMES = ['IMG_4821.HEIC', 'Q3-report.pdf', 'invoice-0193.pdf', 'thesis-final-v7.docx', 'wedding-photos/', 'raw-footage-day2.mov', 'budget-2026.xlsx', 'IMG_4822.HEIC', 'notes-standup.md', 'client-assets/', 'lease-agreement.pdf', 'IMG_4823.HEIC'];
const SIZES = ['3.1 MB', '412 KB', '88 KB', '1.4 MB', '—', '2.2 GB', '64 KB', '2.9 MB', '6 KB', '—', '2.4 MB', '3.0 MB'];
const ROWS = NAMES.map((n, i) => ({ n, s: SIZES[i], c: ACCOUNTS[i % 3].color }));

export function Speed() {
  const ref = useRef(null);
  const countRef = useRef(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    // Writes text directly so the count doesn't re-render React 60 times a second.
    const controls = animate(0, 10000, {
      duration: reduce ? 0 : 1.2,
      ease,
      onUpdate: (v) => { if (countRef.current) countRef.current.textContent = Math.round(v).toLocaleString('en-US'); },
    });
    return () => controls.stop();
  }, [inView, reduce]);

  return (
    <section ref={ref} aria-labelledby="speed-h" className="bg-white px-4 py-24 text-slate-950 md:px-8 md:py-36">
      <div className="mx-auto grid max-w-[1120px] items-center gap-16 md:grid-cols-[5fr_7fr]">
        <div className="flex flex-col gap-5">
          <p className="du-display text-[64px] tabular-nums md:text-[120px]" aria-hidden="true"><span ref={countRef}>10,000</span></p>
          <h2 id="speed-h" className="du-display text-[36px] md:text-[44px]"><span className="sr-only">10,000 </span>files. No lag.</h2>
          <p className="max-w-[380px] text-[17px] leading-[1.55] text-slate-600">We only render what&apos;s on screen, so huge drives stay instant.</p>
        </div>
        <div aria-hidden="true" className="du-fade-y h-[380px] overflow-hidden rounded-2xl bg-[#0b1222] px-5">
          <div className="du-scroll-loop" style={{ animationPlayState: inView && !reduce ? 'running' : 'paused' }}>
            {[...ROWS, ...ROWS].map((r, i) => (
              <div key={i} className="flex h-[38px] items-center gap-3.5 border-b border-white/5 text-[13px] text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.c }} />
                <span className="flex-1">{r.n}</span>
                <span className="text-slate-400">{r.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
