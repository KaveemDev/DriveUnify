'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { FileText, Presentation } from 'lucide-react';

const Line = ({ lead, children, status, waiting }) => (
  <div className="flex items-center gap-3 rounded-xl bg-surface p-3 text-ink">
    {lead}
    <span className="min-w-0 truncate">{children}</span>
    <em className={`ml-auto flex-none text-sm not-italic ${waiting ? 'font-medium text-muted' : 'font-bold text-brand'}`}>{status}</em>
  </div>
);
const Avatar = ({ letter }) => (
  <span className="grid size-8 flex-none place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{letter}</span>
);

const steps = [
  {
    title: 'Sign in with Google',
    body: 'Use the account you open most days. It becomes your DriveUnify login.',
    ui: (
      <>
        <div className="flex h-[52px] items-center justify-center rounded-full bg-surface font-bold text-ink">Continue with Google</div>
        <small className="mt-3.5 block text-center text-sm text-muted">We never see your Google password.</small>
      </>
    ),
  },
  {
    title: 'Add your other accounts',
    body: 'One Google consent screen each, for as many accounts as you have.',
    ui: (
      <div className="grid gap-2">
        <Line lead={<Avatar letter="W" />} status="Connected">aarav@northbeam.studio</Line>
        <Line lead={<Avatar letter="P" />} status="Connected">aarav.mehta@gmail.com</Line>
        <Line lead={<Avatar letter="S" />} status="Waiting" waiting>am2291@halden.edu</Line>
      </div>
    ),
  },
  {
    title: 'Search, preview and copy',
    body: 'Everything you own shows up together. Move a file to another account in two clicks.',
    ui: (
      <div className="grid gap-2">
        <Line lead={<Presentation size={18} className="flex-none text-brand" />} status="Copied">Q3 board deck final.pptx</Line>
        <Line lead={<FileText size={18} className="flex-none text-brand" />} status="Personal" waiting>Lease agreement 2026.pdf</Line>
        <Line lead={<FileText size={18} className="flex-none text-brand" />} status="School" waiting>Thesis chapter 3 draft.docx</Line>
      </div>
    ),
  },
];

function Card({ i, progress, animate, step }) {
  const n = steps.length;
  const scale = useTransform(progress, [i / n, 1], [1, 1 - (n - 1 - i) * 0.04]);
  return (
    <div className="py-2 md:sticky md:top-24 md:flex md:h-[80vh] md:items-start md:py-0">
      <motion.div style={animate ? { scale, top: i * 24 } : undefined} className="relative w-full origin-top">
        <div className="grid items-center gap-7 rounded-3xl bg-surface p-6 shadow-tinted md:min-h-[440px] md:gap-12 md:p-14 lg:grid-cols-2">
          <div>
            <h3 className="text-[clamp(2rem,1.4rem+2vw,3rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink">{step.title}</h3>
            <p className="mt-4 max-w-[40ch] text-lg text-muted">{step.body}</p>
          </div>
          <div className="rounded-[20px] bg-page p-4 md:p-7">{step.ui}</div>
        </div>
      </motion.div>
    </div>
  );
}

// Cards pin and stack as you scroll on desktop; a plain list on phones and under reduced motion.
export function StepsStack() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [desktop, setDesktop] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  useEffect(() => {
    const mq = matchMedia('(min-width: 768px)');
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return (
    <div ref={ref} className="relative mt-10">
      {steps.map((step, i) => (
        <Card key={step.title} i={i} step={step} progress={scrollYProgress} animate={desktop && !reduce} />
      ))}
    </div>
  );
}
