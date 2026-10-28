'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useSpring, useMotionValueEvent } from 'framer-motion';
import { ease, springScroll, springUI } from '@/lib/motion';
import { useDashboardUrl } from './shared';

const LINKS = [
  ['Features', '#features'],
  ['How it works', '#how'],
  ['Integrations', '#integrations'],
  ['Docs', '/docs'],
  ['Blog', '/blog'],
  ['About', '/about'],
];

export function LandingNav({ links = LINKS }) {
  const pathname = usePathname();
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, springScroll);
  const [pill, setPill] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [hovered, setHovered] = useState(null);
  const dashUrl = useDashboardUrl();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setPill(y > 40);
    setHidden(y > 300 && y > prev);
  });

  return (
    <>
      <motion.div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-blue-500" style={{ scaleX: progress }} />
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: 1 }}
        transition={{ duration: 0.5, ease }}
      >
        <motion.nav
          layout
          aria-label="Main"
          transition={{ type: 'spring', ...springUI }}
          className={`mx-auto flex items-center justify-between gap-6 ${pill
            ? 'mt-3 max-w-[1120px] rounded-full border border-white/[0.08] bg-slate-900/70 py-2 pl-5 pr-2 backdrop-blur-xl mx-4 md:mx-auto'
            : 'max-w-[1184px] border border-transparent px-8 py-5'}`}
        >
          <Link href="/" className="flex items-center gap-2.5 text-base font-semibold tracking-[-0.02em] text-white">
            <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-[7px] bg-blue-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
            </span>
            DriveUnify
          </Link>
          <ul className="hidden gap-7 text-sm md:flex" onMouseLeave={() => setHovered(null)}>
            {links.map(([label, href]) => (
              <li key={label} className="relative" onMouseEnter={() => setHovered(label)}>
                <a href={href} aria-current={pathname === href ? 'page' : undefined} className={`block py-1 transition-colors hover:text-white ${pathname === href ? 'text-white' : 'text-slate-300'}`}>{label}</a>
                {(hovered ?? links.find(([, h]) => h === pathname)?.[0]) === label && (
                  <motion.span layoutId="nav-underline" className="absolute inset-x-0 -bottom-0.5 h-px bg-blue-500" transition={{ type: 'spring', ...springUI }} />
                )}
              </li>
            ))}
          </ul>
          <a href={dashUrl} className="flex min-h-11 items-center rounded-full bg-blue-500 px-[18px] text-sm font-medium text-white transition-colors hover:bg-blue-400">
            Open dashboard
          </a>
        </motion.nav>
      </motion.header>
    </>
  );
}
