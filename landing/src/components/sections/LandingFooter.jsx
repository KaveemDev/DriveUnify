'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { springScroll } from '@/lib/motion';

const LINKS = [
  ['Features', '/features'], ['Integrations', '/integrations'], ['Docs', '/docs'], ['Help', '/help'],
  ['Blog', '/blog'], ['About', '/about'], ['Contact', '/contact'], ['Legal', '/legal'],
];

export function LandingFooter() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const fill = useTransform(useSpring(scrollYProgress, springScroll), [0.2, 1], ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']);

  return (
    <footer ref={ref} className="border-t border-white/[0.06] px-4 pb-10 pt-16 md:px-8">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-12">
        <nav aria-label="Footer" className="flex flex-wrap gap-7 text-sm">
          {LINKS.map(([label, href]) => <Link key={href} href={href} className="du-link text-slate-300 hover:text-white">{label}</Link>)}
        </nav>
        <div aria-hidden="true" className="relative select-none whitespace-nowrap text-[18vw] font-bold leading-[0.85] tracking-[-0.06em] lg:text-[200px]">
          <span className="text-transparent [-webkit-text-stroke:1.5px_#334155]">DriveUnify</span>
          <motion.span className="absolute inset-0 text-blue-500" style={{ clipPath: reduce ? 'none' : fill }}>DriveUnify</motion.span>
        </div>
        <p className="text-[13px] text-slate-400">© 2026 DriveUnify</p>
      </div>
    </footer>
  );
}
