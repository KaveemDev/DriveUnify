'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { ease, springScroll } from '@/lib/motion';
import { FileGrid } from '@/components/mocks/FileGrid';
import { FILES } from '@/components/mocks/data';

// Each window: scattered pose → lined-up pose → collapsed into the center.
const WINDOWS = [
  { title: 'Drive — work@acme.co', initial: 'W', color: '#60a5fa', files: ['Q3-report.pdf', 'budget-2026.xlsx', 'client-assets/'], scatter: [-170, -110, -7], line: [-210, -70, 0] },
  { title: 'Drive — personal', initial: 'P', color: '#f59e0b', files: ['wedding-photos/', 'passport-scan.jpg', 'lease-agreement.pdf'], scatter: [110, -140, 5], line: [0, -70, 0] },
  { title: 'Dropbox', initial: 'D', color: '#0061FF', files: ['thesis-final-v7.docx', 'launch-teaser.mp4', 'invoices/'], scatter: [-120, 90, 4], line: [210, -70, 0] },
  { title: 'Drive — side-project', initial: 'S', color: '#4ade80', files: ['pitch-deck-v3.pdf', 'logo-final-FINAL.png'], scatter: [150, 110, -5], line: [-105, 100, 0] },
  { title: 'Drive — school', initial: 'U', color: '#e879f9', files: ['lab-report-week9.docx', 'notes/'], scatter: [10, 10, 9], line: [105, 100, 0] },
];

const STEPS = [
  { kicker: 'The problem', body: 'Every account lives in its own tab, with its own login and its own search box.' },
  { kicker: 'Connect them once', body: 'Sign in with Google, then add each Drive and Dropbox account. That’s the whole setup.' },
  { kicker: 'Now it’s one drive', body: 'One grid, one search, one place to move things between accounts.' },
];

function BrowserWindow({ w, p }) {
  const t = [0, 0.35, 0.6, 0.75];
  const x = useTransform(p, t, [w.scatter[0], w.line[0], w.line[0], 0]);
  const y = useTransform(p, t, [w.scatter[1], w.line[1], w.line[1], 0]);
  const rotate = useTransform(p, t, [w.scatter[2], w.line[2], 0, 0]);
  const scale = useTransform(p, t, [1, 0.82, 0.82, 0.6]);
  const opacity = useTransform(p, [0.66, 0.76], [1, 0]);
  return (
    <motion.div style={{ x, y, rotate, scale, opacity }} className="absolute left-1/2 top-1/2 -ml-[120px] -mt-[60px] w-[240px]">
      <WindowCard w={w} />
    </motion.div>
  );
}

function WindowCard({ w }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-slate-900 shadow-2xl shadow-black/40">
      <div className="flex h-[30px] items-center gap-2 border-b border-white/[0.06] px-2.5 text-[11px] text-slate-400">
        <span className="grid h-[18px] w-[18px] place-items-center rounded-full text-[10px] font-bold text-slate-950" style={{ background: w.color }}>{w.initial}</span>
        {w.title}
      </div>
      <div className="flex flex-col gap-2 p-3 text-xs text-slate-300">
        {w.files.map((f) => <span key={f}>{f}</span>)}
      </div>
    </div>
  );
}

export function Problem() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const pinned = !reduce;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, springScroll);
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(v < 0.33 ? 0 : v < 0.66 ? 1 : 2));
  const mergedOpacity = useTransform(p, [0.7, 0.85], [0, 1]);
  const mergedScale = useTransform(p, [0.7, 0.85], [0.92, 1]);

  const heading = (
    <h2 id="problem-h" className="du-display text-[36px] text-white md:text-[56px]">
      Five tabs. Three logins. Zero idea where that file is.
    </h2>
  );

  if (!pinned) {
    return (
      <section ref={ref} aria-labelledby="problem-h" className="px-4 py-24 md:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-8">
          {heading}
          {STEPS.map((s) => (
            <motion.div key={s.kicker} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: reduce ? 0 : 0.6 }}>
              <h3 className="text-lg font-medium text-white">{s.kicker}</h3>
              <p className="mt-1 text-[17px] text-slate-400">{s.body}</p>
            </motion.div>
          ))}
          <div aria-hidden="true" className="rounded-2xl border border-white/[0.08] bg-[#0b1222] p-4"><FileGrid files={FILES.slice(0, 4)} columns={2} /></div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} aria-labelledby="problem-h" className="relative h-[250vh] px-4 md:px-8">
      <div className="sticky top-0 mx-auto grid h-svh max-w-[1120px] content-center items-center gap-6 md:h-screen md:grid-cols-[5fr_7fr] md:content-normal md:gap-16">
        <div className="flex flex-col gap-4 md:gap-10">
          {heading}
          <div className="relative h-[120px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ clipPath: 'inset(0 0 100% 0)', y: 16 }}
                animate={{ clipPath: 'inset(0 0 0% 0)', y: 0 }}
                exit={{ clipPath: 'inset(100% 0 0 0)', y: -16 }}
                transition={{ duration: 0.45, ease }}
                className="absolute inset-0"
              >
                <div className="text-sm font-medium text-blue-400">0{step + 1} — {STEPS[step].kicker}</div>
                <p className="mt-2 text-[19px] leading-snug text-slate-200">{STEPS[step].body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div aria-hidden="true" className="relative h-[300px] md:h-[520px]">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[560px] -translate-x-1/2 -translate-y-1/2 scale-[0.6] md:static md:h-full md:w-full md:translate-x-0 md:translate-y-0 md:scale-100">
          {WINDOWS.map((w) => <BrowserWindow key={w.title} w={w} p={p} />)}
          <motion.div style={{ opacity: mergedOpacity, scale: mergedScale }} className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.08] bg-[#0b1222] p-5 shadow-[0_40px_120px_rgba(59,130,246,0.18)]">
            <div className="mb-3 text-[13px] text-slate-400">All drives <span className="text-slate-600">/</span> <span className="text-slate-200">Everything</span></div>
            <FileGrid files={FILES} />
          </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
