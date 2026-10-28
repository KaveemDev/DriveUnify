'use client';
import { useEffect, useState } from 'react';

// Shared motion values for the landing page. Animate only transform, opacity, filter, clip-path.
export const ease = [0.22, 1, 0.36, 1];
export const springUI = { stiffness: 300, damping: 30 };
export const springScroll = { stiffness: 100, damping: 20, mass: 0.5 };
export const dur = { micro: 0.15, ui: 0.3, section: 0.8 };
export const stagger = 0.07;

export const maskReveal = {
  hidden: { y: '100%' },
  show: (i = 0) => ({ y: '0%', transition: { duration: dur.section, ease, delay: i * stagger } }),
};

export const clipReveal = {
  hidden: { clipPath: 'inset(100% 0 0 0)' },
  show: (i = 0) => ({ clipPath: 'inset(0% 0 0 0)', transition: { duration: dur.section, ease, delay: i * stagger } }),
};

// Desktop = wide viewport with a fine pointer; pinned/scrubbed sequences only run there.
export function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
}
