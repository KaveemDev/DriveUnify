'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ease, springScroll, springUI, useIsDesktop } from '@/lib/motion';
import { StorageBar } from '@/components/mocks/StorageBar';
import { ACCOUNTS } from '@/components/mocks/data';

function StepNumber({ n, active }) {
  return (
    <span className="relative block text-[72px] font-semibold leading-none tracking-[-0.04em]">
      <span className="text-transparent [-webkit-text-stroke:1.5px_#475569]">{n}</span>
      <motion.span aria-hidden="true" className="absolute inset-0 text-blue-500" animate={{ opacity: active ? 1 : 0 }} transition={{ duration: 0.4 }}>{n}</motion.span>
    </span>
  );
}

function GoogleButton({ active }) {
  return (
    <motion.div
      animate={active ? { scale: [1, 0.95, 1] } : { scale: 1 }}
      transition={{ duration: 0.45, ease, delay: 0.4 }}
      className="mt-auto flex h-12 items-center justify-center gap-2.5 rounded-[10px] bg-white text-sm font-medium text-gray-800"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z" /><path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10 10 0 0 0 12 22z" /><path fill="#FBBC05" d="M6.2 13.6a6 6 0 0 1 0-3.9V7H2.7a10 10 0 0 0 0 9z" /><path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 2.7 7l3.5 2.7C7 7.7 9.3 5.9 12 5.9z" /></svg>
      Continue with Google
    </motion.div>
  );
}

function ProviderTile({ name, color, connected, soon }) {
  return (
    <div className={`flex h-11 items-center gap-2.5 rounded-[10px] px-3 text-sm ${soon ? 'border border-dashed border-white/10 text-slate-400' : 'bg-slate-800 text-slate-200'}`}>
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {name}
      <span className="ml-auto text-xs">
        {soon ? 'Soon' : (
          <AnimatePresence mode="wait" initial={false}>
            {connected ? (
              <motion.span key="on" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', ...springUI }} className="flex items-center gap-1 text-green-400">
                <Check size={12} strokeWidth={3} />Connected
              </motion.span>
            ) : (
              <motion.span key="off" exit={{ scale: 0.8, opacity: 0 }} className="block rounded-md bg-blue-500 px-2.5 py-1 text-white">Connect</motion.span>
            )}
          </AnimatePresence>
        )}
      </span>
    </div>
  );
}

const PANELS = [
  {
    title: 'Sign in with Google',
    body: 'One account opens the dashboard. Nothing to install.',
    ui: (active) => <GoogleButton active={active} />,
  },
  {
    title: 'Connect your drives',
    body: 'Add as many Google Drive accounts as you have, plus Dropbox.',
    ui: (active) => (
      <div className="mt-auto flex flex-col gap-2">
        <ProviderTile name="Google Drive" color="#60a5fa" connected={active} />
        <ProviderTile name="Dropbox" color="#0061FF" connected={active} />
        <ProviderTile name="OneDrive" color="#475569" soon />
      </div>
    ),
  },
  {
    title: 'Everything appears',
    body: 'Every file, every folder, and how much room you have left.',
    ui: (active) => {
      const used = ACCOUNTS.reduce((s, a) => s + a.used, 0);
      const total = ACCOUNTS.reduce((s, a) => s + a.total, 0);
      return (
        <div className="mt-auto flex flex-col gap-2.5 text-xs text-slate-400">
          {active && ACCOUNTS.map((a, i) => (
            <div key={a.id} className="flex flex-col gap-1.5">
              <div className="flex justify-between"><span>{a.name}</span><span>{a.used} / {a.total} GB</span></div>
              <StorageBar value={a.used / a.total} color={a.color} height={6} delay={i * 0.15} />
            </div>
          ))}
          {active && (
            <div className="mt-1 flex flex-col gap-1.5 text-slate-200">
              <div className="flex justify-between"><span>All drives</span><span>{used.toFixed(1)} / {total} GB</span></div>
              <StorageBar value={used / total} height={8} delay={0.6} />
            </div>
          )}
        </div>
      );
    },
  },
];

function Panel({ i, active, className = '' }) {
  const panel = PANELS[i];
  return (
    <div className={`flex min-h-[380px] flex-col gap-5 rounded-2xl border bg-slate-900 p-7 transition-colors duration-500 ${active ? 'border-blue-500/40' : 'border-white/[0.08]'} ${className}`}>
      <StepNumber n={`0${i + 1}`} active={active} />
      <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-white">{panel.title}</h3>
      <p className="text-[15px] leading-normal text-slate-400">{panel.body}</p>
      {panel.ui(active)}
    </div>
  );
}

const heading = (
  <h2 id="how-h" className="du-display max-w-[640px] text-[36px] text-white md:text-[56px]">Three steps, about a minute.</h2>
);

export function HowItWorks() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  const pinned = !reduce;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  // Desktop keeps its -50% track; phones move by however far the track overflows the screen.
  const track = useRef(null);
  const overflow = useRef(0);
  useEffect(() => {
    const measure = () => { if (track.current) overflow.current = track.current.scrollWidth - window.innerWidth; };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [pinned]);
  const desktopRef = useRef(desktop);
  desktopRef.current = desktop;
  const x = useTransform(useSpring(scrollYProgress, springScroll), (v) => (desktopRef.current ? `${-50 * v}%` : -v * overflow.current));
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(2, Math.floor(v * 3))));
  const [seen, setSeen] = useState([false, false, false]);

  if (!pinned) {
    return (
      <section ref={ref} id="how" aria-labelledby="how-h" className="border-y border-white/[0.06] bg-[#050b1a] px-4 py-24 md:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
          <div className="mb-8">{heading}</div>
          {PANELS.map((_, i) => (
            <motion.div key={i} onViewportEnter={() => setSeen((s) => s.map((v, j) => v || j === i))} viewport={{ once: true, amount: 0.4 }}>
              <Panel i={i} active={seen[i]} />
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="how" aria-labelledby="how-h" className="relative h-[300vh] border-y border-white/[0.06] bg-[#050b1a]">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden md:h-screen">
        <div className="mx-auto mb-8 w-full max-w-[1120px] px-4 md:mb-12 md:px-8">{heading}</div>
        {/* Track is 150% of the viewport wide: three 50%-ish panels, scrolled left by half its width. */}
        <motion.div ref={track} style={{ x }} className="flex w-max gap-4 px-4 md:w-[150vw] md:gap-6 md:pl-[max(32px,calc((100vw-1120px)/2))] md:pr-0">
          {PANELS.map((_, i) => <Panel key={i} i={i} active={active >= i} className="w-[85vw] shrink-0 md:w-[min(560px,42vw)]" />)}
        </motion.div>
      </div>
    </section>
  );
}
