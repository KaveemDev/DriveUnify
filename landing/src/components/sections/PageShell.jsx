'use client';
import '@/app/landing.css';
import { motion } from 'framer-motion';
import { ease } from '@/lib/motion';
import { LandingNav } from './LandingNav';
import { LandingFooter } from './LandingFooter';
import { RevealHeading } from './shared';

const SITE_LINKS = [
  ['Features', '/features'],
  ['Integrations', '/integrations'],
  ['Docs', '/docs'],
  ['Blog', '/blog'],
  ['About', '/about'],
];

// Landing-page chrome (dark canvas, grain, nav, footer) for the secondary pages.
export function PageShell({ children }) {
  return (
    <div className="du-landing">
      <LandingNav links={SITE_LINKS} />
      <main>{children}</main>
      <LandingFooter />
    </div>
  );
}

export function PageHero({ eyebrow, lines, children }) {
  return (
    <section className="relative px-4 pb-16 pt-40 md:px-8 md:pb-24 md:pt-48">
      <div aria-hidden="true" className="du-dots absolute inset-0" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[480px]" style={{ background: 'radial-gradient(50% 60% at 50% 0%, rgba(59,130,246,0.18), rgba(2,6,23,0) 70%)' }} />
      <div className="relative mx-auto flex max-w-[1120px] flex-col gap-6">
        <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
          className="w-fit rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-[13px] text-blue-300">
          {eyebrow}
        </motion.span>
        <RevealHeading as="h1" lines={lines} className="md:text-[80px]" />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.3 }}
          className="max-w-[620px] text-[18px] leading-[1.55] text-slate-400">
          {children}
        </motion.div>
      </div>
    </section>
  );
}

// Spotlight card, same behaviour as the landing Bento tiles.
export function SpotCard({ className = '', children, ...rest }) {
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
  };
  return (
    <div onMouseMove={onMove} className={`du-spot rounded-2xl border border-white/[0.06] bg-slate-900 p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}
