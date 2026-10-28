'use client';
import { useRef, useSyncExternalStore } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { getDashboardUrl } from '@/lib/auth-sync';
import { maskReveal, springUI, dur } from '@/lib/motion';

// getDashboardUrl reads window; the server snapshot keeps hydration consistent.
const noSubscribe = () => () => {};
export function useDashboardUrl() {
  return useSyncExternalStore(noSubscribe, getDashboardUrl, () => 'https://dashboard.driveunify.com');
}

export function PrimaryButton({ children, className = '', size = 'md' }) {
  const href = useDashboardUrl();
  const ref = useRef(null);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--hx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--hy', `${e.clientY - r.top}px`);
  };
  const pad = size === 'lg' ? 'px-7 py-[18px] text-[17px] rounded-xl' : 'px-[22px] py-3.5 text-[15px] rounded-[10px]';
  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={onMove}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: dur.micro }}
      className={`du-btn relative inline-flex items-center overflow-hidden bg-blue-500 font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_32px_rgba(59,130,246,0.35)] hover:bg-blue-400 ${pad} ${className}`}
    >
      <span className="relative">{children}</span>
    </motion.a>
  );
}

export function SecondaryButton({ href, children }) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: dur.micro }}
      className="inline-flex items-center rounded-[10px] border border-white/[0.12] px-[22px] py-3.5 text-[15px] font-medium text-slate-200 hover:border-white/25"
    >
      {children}
    </motion.a>
  );
}

// Follows the cursor within 60px, springs back on leave.
export function Magnetic({ children }) {
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), springUI);
  const y = useSpring(useMotionValue(0), springUI);
  const onMove = (e) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    x.set(Math.max(-60, Math.min(60, dx * 0.35)));
    y.set(Math.max(-60, Math.min(60, dy * 0.35)));
  };
  const reset = () => { x.set(0); y.set(0); };
  return (
    <motion.div style={{ x, y }} onMouseMove={onMove} onMouseLeave={reset} className="inline-block p-4 -m-4">
      {children}
    </motion.div>
  );
}

// Section heading: each line slides up out of a mask when 30% in view.
export function RevealHeading({ id, lines, className = '', as: Tag = 'h2' }) {
  return (
    <Tag id={id} className={`du-display text-[36px] md:text-[56px] text-white ${className}`}>
      <motion.span initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="block">
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden pb-[0.08em]">
            <motion.span className="block" variants={maskReveal} custom={i}>{line}</motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
