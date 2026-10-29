'use client';
import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, useMotionValue, useReducedMotion } from 'framer-motion';
import { ease, springScroll, springUI, stagger, useIsDesktop } from '@/lib/motion';
import { DashboardFrame, SearchBar } from '@/components/mocks/DashboardFrame';
import { Sidebar } from '@/components/mocks/Sidebar';
import { FileGrid } from '@/components/mocks/FileGrid';
import { FILES } from '@/components/mocks/data';
import { PrimaryButton, SecondaryButton } from './shared';

const LINE_1 = ['All', 'your', 'drives.'];
const LINE_2 = ['One', 'window.'];
const WORDS_DONE = (LINE_1.length + LINE_2.length) * stagger + 0.2;

function Word({ children, i, muted }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
      <motion.span
        className={`inline-block ${muted ? 'text-slate-500' : ''}`}
        initial={{ y: '100%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.8, ease, delay: 0.15 + i * stagger }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  const scrub = !reduce;
  const tilt = desktop && !reduce;

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const p = useSpring(scrollYProgress, springScroll);
  const rotateX = useTransform(p, [0, 0.6], [12, 0]);
  const scale = useTransform(p, [0, 0.6], [1, 1.08]);
  const textY = useTransform(p, [0, 1], [0, 220]);
  const textOpacity = useTransform(p, [0, 0.5], [1, 0]);
  const lightY = useTransform(p, [0, 1], ['0%', '30%']);

  // Cursor tilt, ±4deg, springy. Off on touch (no mousemove fires there).
  const tiltX = useSpring(useMotionValue(0), springUI);
  const tiltY = useSpring(useMotionValue(0), springUI);
  const onMove = (e) => {
    if (!tilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    tiltY.set(((e.clientX - r.left) / r.width - 0.5) * 8);
    tiltX.set(-((e.clientY - r.top) / r.height - 0.5) * 8);
  };
  const rotateXTotal = useTransform([rotateX, tiltX], ([a, b]) => a + b);

  return (
    <section ref={ref} aria-labelledby="hero-h" className="relative overflow-hidden px-4 pb-32 pt-36 md:px-8 md:pt-44">
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ y: scrub ? lightY : 0, background: 'radial-gradient(60% 50% at 70% 70%, rgba(59,130,246,0.22), rgba(245,246,248,0) 70%)' }} />
      <div aria-hidden="true" className="du-dots pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-[1120px]">
        <motion.div style={scrub ? { y: textY, opacity: textOpacity } : undefined}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="mb-6 flex items-center gap-2 text-[13px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Google Drive + Dropbox · OneDrive coming soon
          </motion.p>
          <h1 id="hero-h" className="du-display max-w-[820px] text-[44px] text-white md:text-[clamp(2.75rem,1.2rem+4vw,4.5rem)]">
            {LINE_1.map((w, i) => <Word key={w} i={i}>{w}&nbsp;</Word>)}
            <br />
            {LINE_2.map((w, i) => <Word key={w} i={LINE_1.length + i} muted>{w}&nbsp;</Word>)}
          </h1>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: WORDS_DONE }}>
            <p className="mt-7 max-w-[520px] text-[17px] leading-[1.55] text-slate-400 md:text-[19px]">
              Connect every Google Drive and Dropbox account you own, then search, preview and move files between them without switching tabs.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <PrimaryButton>Connect your drives free</PrimaryButton>
              <SecondaryButton href="#how">See how it works</SecondaryButton>
            </div>
          </motion.div>
        </motion.div>

        <div className="mt-20 [perspective:1200px]" onMouseMove={onMove} onMouseLeave={() => { tiltX.set(0); tiltY.set(0); }}>
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(12px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease, delay: WORDS_DONE }}
          >
            <motion.div style={scrub ? { rotateX: rotateXTotal, rotateY: tiltY, scale, transformOrigin: '50% 0%' } : undefined}>
              <DashboardFrame className="shadow-[0_40px_120px_rgba(59,130,246,0.18)]" sidebar={<Sidebar revealDelay={WORDS_DONE + 0.5} />}>
                <div className="flex items-center gap-3">
                  <div className="flex-1"><SearchBar /></div>
                  <span className="rounded-lg bg-blue-500 px-3.5 py-2 text-[13px] text-[#fff]">Upload</span>
                </div>
                <div className="text-[13px] text-slate-400">All drives <span className="text-slate-600">/</span> <span className="text-slate-200">Recent</span></div>
                <div className="hidden md:block"><FileGrid files={FILES} /></div>
                <div className="md:hidden"><FileGrid files={FILES.slice(0, 4)} columns={2} /></div>
              </DashboardFrame>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
