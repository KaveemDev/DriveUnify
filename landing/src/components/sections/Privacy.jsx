'use client';
import { motion } from 'framer-motion';
import { ease } from '@/lib/motion';

const FACTS = [
  ['Sign-in', 'Google sign-in through Firebase. We never see your password.'],
  ['Your files', 'They stay in your own Google Drive and Dropbox. DriveUnify talks to those APIs directly from your browser.'],
  ['Account data', 'Firestore rules mean only you can read your connected-account list.'],
];

export function Privacy() {
  return (
    <section aria-labelledby="privacy-h" className="px-4 py-32 md:px-8 md:py-44">
      <div className="mx-auto flex max-w-[820px] flex-col gap-14">
        <motion.div initial="open" whileInView="closed" viewport={{ once: true, amount: 0.6 }} className="flex items-start gap-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className="shrink-0">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <motion.path d="M8 10V7a4 4 0 0 1 8 0v3" variants={{ open: { y: -3 }, closed: { y: 0, transition: { duration: 0.6, ease, delay: 0.4 } } }} />
          </svg>
          <h2 id="privacy-h" className="du-display text-[36px] text-white md:text-[56px]">Your files never touch our servers.</h2>
        </motion.div>
        <dl className="border-t border-white/[0.08]">
          {FACTS.map(([term, desc], i) => (
            <motion.div key={term} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.1, ease, delay: i * 0.15 }}
              className="flex flex-wrap gap-8 border-b border-white/[0.08] py-6">
              <dt className="w-[200px] text-[15px] font-medium text-white">{term}</dt>
              <dd className="flex-[1_1_280px] text-[17px] leading-[1.55] text-slate-400">{desc}</dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}
