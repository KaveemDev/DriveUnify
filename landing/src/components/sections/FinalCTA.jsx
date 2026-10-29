'use client';
import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { springScroll } from '@/lib/motion';
import { Magnetic, PrimaryButton } from './shared';

export function FinalCTA() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const p = useSpring(scrollYProgress, springScroll);
  const scale = useTransform(p, [0, 1], [0.9, 1]);
  // letter-spacing isn't a transform; it only changes on this one heading while it enters.
  const letterSpacing = useTransform(p, [0, 1], ['-0.01em', '-0.055em']);

  return (
    <section ref={ref} aria-labelledby="cta-h" className="px-4 py-32 md:px-8 md:py-40" style={{ background: 'radial-gradient(50% 60% at 50% 100%, rgba(59,130,246,0.28), rgba(245,246,248,0) 70%)' }}>
      <div className="mx-auto flex max-w-[1120px] flex-col gap-10">
        <motion.h2 id="cta-h" style={reduce ? undefined : { scale, letterSpacing, transformOrigin: '0% 50%' }}
          className="du-display text-[52px] leading-[0.92] text-white md:text-[120px]">
          Close the other<br />five tabs.
        </motion.h2>
        <div className="flex flex-wrap items-center gap-6">
          <Magnetic><PrimaryButton size="lg">Connect your drives free</PrimaryButton></Magnetic>
          <span className="text-sm text-slate-400">Free. Sign in with Google.</span>
        </div>
      </div>
    </section>
  );
}
