'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const dashUrl = useDashboardUrl();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setPill(y > 40);
    setHidden(y > 300 && y > prev);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <motion.div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-blue-500" style={{ scaleX: progress }} />
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: hidden && !open ? -100 : 0, opacity: 1 }}
        transition={{ duration: 0.5, ease }}
      >
        <motion.nav
          layout
          aria-label="Main"
          transition={{ type: 'spring', ...springUI }}
          className={`mx-auto flex items-center justify-between gap-3 md:gap-6 ${pill
            ? 'mt-3 max-w-[1120px] rounded-full border border-white/[0.08] bg-slate-900/70 py-2 pl-5 pr-2 backdrop-blur-xl mx-4 md:mx-auto'
            : 'max-w-[1184px] border border-transparent px-4 py-5 md:px-8'}`}
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
          <div className="flex items-center gap-2">
            <a href={dashUrl} className="flex min-h-11 items-center rounded-full bg-blue-500 px-3.5 text-sm font-medium text-[#fff] transition-colors hover:bg-blue-400 md:px-[18px]">
              Open dashboard
            </a>
            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((o) => !o)}
              className="grid h-11 w-11 place-items-center rounded-full text-white transition-colors active:bg-slate-800 md:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={open ? 'x' : 'menu'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  {open ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </motion.nav>
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.25, ease }}
              className="mx-4 mt-2 origin-top rounded-2xl border border-white/[0.08] bg-slate-900 p-2 shadow-[0_24px_48px_-24px_rgba(16,19,26,0.35)] md:hidden"
            >
              <ul className="flex flex-col">
                {links.map(([label, href], i) => (
                  <motion.li key={label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, ease, delay: 0.04 + i * 0.04 }}>
                    <a
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === href ? 'page' : undefined}
                      className={`flex min-h-12 items-center rounded-xl px-4 text-[17px] transition-colors active:bg-slate-800 ${pathname === href ? 'font-medium text-blue-500' : 'text-white'}`}
                    >
                      {label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
