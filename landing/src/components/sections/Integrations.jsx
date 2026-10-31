'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { ease } from '@/lib/motion';
import { RevealHeading } from './shared';

export const DriveLogo = () => (
  <svg width="30" height="27" viewBox="0 0 87 78" aria-hidden="true"><path fill="#0066DA" d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" /><path fill="#00AC47" d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9 9 0 0 0 0 53h27.5z" /><path fill="#EA4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" /><path fill="#00832D" d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" /><path fill="#2684FC" d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" /><path fill="#FFBA00" d="M73.4 26.5 60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" /></svg>
);
export const DropboxLogo = () => (
  <svg width="30" height="28" viewBox="0 0 24 22" fill="#0061FF" aria-hidden="true"><path d="M6 0 0 3.9l6 3.9 6-3.9zm12 0-6 3.9 6 3.9 6-3.9zM0 11.7l6 3.9 6-3.9-6-3.9zm18-3.9-6 3.9 6 3.9 6-3.9zM6 17l6 3.9 6-3.9-6-3.9z" /></svg>
);
export const OneDriveLogo = () => (
  <svg width="30" height="20" viewBox="0 0 24 16" fill="none" stroke="#94a3b8" strokeWidth="1.6" aria-hidden="true"><path d="M6 15h13a4 4 0 0 0 .5-8A6 6 0 0 0 8 5.5 4.5 4.5 0 0 0 6 15z" /></svg>
);

export const BoxLogo = () => (
  <svg width="34" height="18" viewBox="0 0 40 20" aria-hidden="true"><text x="20" y="16" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="19" fill="#0061D5">box</text></svg>
);
export const MegaLogo = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#D9272E" /><path d="M6.5 16.5v-9l5.5 5.5 5.5-5.5v9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" /></svg>
);
export const ICloudLogo = () => (
  <svg width="32" height="22" viewBox="0 0 24 16" fill="#3693F3" aria-hidden="true"><path d="M6 15h13a4 4 0 0 0 .5-8A6 6 0 0 0 8 5.5 4.5 4.5 0 0 0 6 15z" /></svg>
);

const R = 170;
const PROVIDERS = [
  { name: 'Google Drive', Logo: DriveLogo, angle: -90, live: true, label: 'Live' },
  { name: 'OneDrive', Logo: OneDriveLogo, angle: -30, live: false, label: 'Next up' },
  { name: 'Box', Logo: BoxLogo, angle: 30, live: false, label: 'Planned' },
  { name: 'MEGA', Logo: MegaLogo, angle: 90, live: false, label: 'Planned' },
  { name: 'iCloud Drive', Logo: ICloudLogo, angle: 150, live: false, label: 'Planned' },
  { name: 'Dropbox', Logo: DropboxLogo, angle: 210, live: true, label: 'Live' },
];

export function Integrations() {
  const reduce = useReducedMotion();
  return (
    <section id="integrations" aria-labelledby="int-h" className="border-t border-white/[0.06] bg-[#eceef3] px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-[1120px] items-center gap-16 md:grid-cols-[5fr_7fr]">
        <div className="flex flex-col gap-4">
          <RevealHeading id="int-h" lines={['Works with the drives', 'you already pay for.']} />
          <p className="text-[17px] leading-[1.55] text-slate-400">Google Drive and Dropbox today. OneDrive is next, with Box, MEGA and iCloud Drive on the roadmap.</p>
          <ul className="sr-only">{PROVIDERS.map((p) => <li key={p.name}>{p.name}: {p.label}</li>)}</ul>
        </div>
        <div aria-hidden="true" className="relative mx-auto h-[420px] w-full max-w-[420px] scale-[0.8] md:scale-100">
          <svg className="absolute inset-0" viewBox="-210 -210 420 420">
            <circle r={R} fill="none" stroke="rgba(16,19,26,0.15)" strokeDasharray="4 6" />
            {PROVIDERS.map((p, i) => {
              const x = Math.cos((p.angle * Math.PI) / 180) * R;
              const y = Math.sin((p.angle * Math.PI) / 180) * R;
              return (
                <motion.line key={p.name} x1="0" y1="0" x2={x} y2={y} stroke={p.live ? '#2348d8' : '#dfe2ea'} strokeWidth="1.5" strokeDasharray={p.live ? undefined : '3 5'}
                  initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.8, ease, delay: 0.2 + i * 0.15 }} />
              );
            })}
          </svg>
          {/* Slow orbit: the ring rotates, each logo counter-rotates to stay upright. */}
          <motion.div className="absolute inset-0" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 120, ease: 'linear', repeat: Infinity }}>
            {PROVIDERS.map((p) => {
              const x = Math.cos((p.angle * Math.PI) / 180) * R;
              const y = Math.sin((p.angle * Math.PI) / 180) * R;
              return (
                <div key={p.name} className="absolute left-1/2 top-1/2" style={{ transform: `translate(${x}px, ${y}px)` }}>
                  <motion.div animate={reduce ? undefined : { rotate: -360 }} transition={{ duration: 120, ease: 'linear', repeat: Infinity }}
                    className={`-ml-8 -mt-8 flex flex-col items-center gap-2 ${p.live ? '' : 'opacity-50'}`}>
                    <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-slate-900 ${p.live ? 'border border-white/10' : 'border border-dashed border-white/20'}`}><p.Logo /></div>
                    <span className={`whitespace-nowrap text-[11px] ${p.live ? 'text-green-400' : 'text-slate-300'}`}>{p.label}</span>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
          <div className="absolute left-1/2 top-1/2 -ml-11 -mt-11 grid h-[88px] w-[88px] place-items-center rounded-[22px] bg-blue-500 shadow-[0_0_80px_rgba(59,130,246,0.45)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
          </div>
        </div>
      </div>
    </section>
  );
}
