'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus, Clock } from 'lucide-react';
import { ease, springUI, clipReveal } from '@/lib/motion';
import { RevealHeading } from '@/components/sections/shared';
import { SpotCard } from '@/components/sections/PageShell';
import { DriveLogo, DropboxLogo, OneDriveLogo, BoxLogo, MegaLogo, ICloudLogo } from '@/components/sections/Integrations';

const CAPS = ['Browse folders', 'Search across accounts', 'Upload', 'Download & preview', 'Copy to another drive', 'Storage usage', 'Rename, delete, new folder', 'Star & share links'];

// yes / no per capability, in CAPS order.
const PROVIDERS = [
  { id: 'gdrive', Logo: DriveLogo, name: 'Google Drive', color: '#2684FC', status: 'Live', caps: [1, 1, 1, 1, 1, 1, 1, 1],
    note: 'Connect as many personal, work and school accounts as you like. Copies between Google accounts run on Google’s servers, so nothing is downloaded.' },
  { id: 'dropbox', Logo: DropboxLogo, name: 'Dropbox', color: '#0061FF', status: 'Live', caps: [1, 1, 1, 1, 1, 1, 0, 0],
    note: 'Browse and search your Dropbox next to your Drives, upload into it, and move files in or out with cross-drive copy.' },
  { id: 'onedrive', Logo: OneDriveLogo, name: 'OneDrive', color: '#94a3b8', status: 'Next up', caps: [0, 0, 0, 0, 0, 0, 0, 0],
    note: 'Personal OneDrive and Microsoft 365 accounts are the next provider we are building.' },
  { id: 'box', Logo: BoxLogo, name: 'Box', color: '#0061D5', status: 'Planned', caps: [0, 0, 0, 0, 0, 0, 0, 0],
    note: 'Box accounts are on the roadmap, so work files stored in Box can sit next to your Drives.' },
  { id: 'mega', Logo: MegaLogo, name: 'MEGA', color: '#D9272E', status: 'Planned', caps: [0, 0, 0, 0, 0, 0, 0, 0],
    note: 'MEGA support is planned, including its generous free storage in your combined pool.' },
  { id: 'icloud', Logo: ICloudLogo, name: 'iCloud Drive', color: '#3693F3', status: 'Planned', caps: [0, 0, 0, 0, 0, 0, 0, 0],
    note: 'iCloud Drive is planned, so Apple users can browse it alongside every other drive.' },
];

export function ProviderMatrix() {
  const [id, setId] = useState('gdrive');
  const p = PROVIDERS.find((x) => x.id === id);
  const soon = p.status !== 'Live';
  return (
    <section aria-labelledby="matrix-h" className="px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1120px]">
        <RevealHeading id="matrix-h" lines={['What works,', 'where.']} className="mb-12" />
        <div className="mb-8 flex flex-wrap gap-2" role="tablist">
          {PROVIDERS.map((x) => (
            <button key={x.id} role="tab" aria-selected={id === x.id} onClick={() => setId(x.id)}
              className={`relative flex items-center gap-2.5 rounded-full px-5 py-3 text-[15px] transition-colors ${id === x.id ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
              {id === x.id && <motion.span layoutId="provider-pill" className="absolute inset-0 rounded-full border border-white/10 bg-slate-900" transition={{ type: 'spring', ...springUI }} />}
              <span className="relative h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />
              <span className="relative">{x.name}</span>
              <span className={`relative text-[11px] ${x.status === 'Live' ? 'text-green-400' : 'text-amber-300'}`}>{x.status}</span>
            </button>
          ))}
        </div>
        <SpotCard role="tabpanel" className="grid gap-8 bg-[#ffffff] p-6 md:grid-cols-[5fr_7fr] md:p-10">
          <AnimatePresence mode="wait">
            <motion.div key={id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease }} className="flex flex-col gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-slate-900"><p.Logo /></span>
              <h3 className="text-[28px] font-semibold tracking-[-0.02em] text-white">{p.name}</h3>
              <p className="text-[16px] leading-[1.6] text-slate-400">{p.note}</p>
              {soon && <Link href="/contact" className="du-link w-fit text-[15px] text-blue-300">Tell us you want it →</Link>}
            </motion.div>
          </AnimatePresence>
          <ul className="flex flex-col">
            {CAPS.map((cap, i) => {
              const on = p.caps[i];
              return (
                <li key={cap} className="flex items-center justify-between border-b border-white/[0.06] py-3 text-[15px] last:border-0">
                  <span className={on ? 'text-slate-200' : 'text-slate-500'}>{cap}</span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={`${id}-${on}`} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: 'spring', ...springUI, delay: i * 0.03 }}
                      className={`grid h-6 w-6 place-items-center rounded-full ${on ? 'bg-green-400/15 text-green-400' : soon ? 'bg-amber-400/10 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                      {on ? <Check size={14} /> : soon ? <Clock size={13} /> : <Minus size={14} />}
                    </motion.span>
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </SpotCard>
        <p className="mt-4 text-[13px] text-slate-500">— means not yet supported for that provider. Rename, delete and folder creation are Google Drive only for now.</p>
      </div>
    </section>
  );
}

const STEPS = [
  ['Sign in once', 'Sign in to DriveUnify with Google. That account is just your login — it doesn’t have to be a drive you connect.'],
  ['Connect a drive', 'Open the dashboard, choose “Connect Drive”, pick Google Drive or Dropbox and approve access on the provider’s own consent screen.'],
  ['Repeat for every account', 'Add your work Drive, school Drive and personal Dropbox. Each one appears in the sidebar with its own storage bar.'],
];

export function ConnectSteps() {
  const [open, setOpen] = useState(0);
  return (
    <section aria-labelledby="connect-h" className="border-t border-white/[0.06] bg-[#eceef3] px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-[1120px] gap-12 md:grid-cols-[5fr_7fr]">
        <div className="flex flex-col gap-4">
          <RevealHeading id="connect-h" lines={['Connected in', 'under a minute.']} />
          <p className="text-[17px] leading-[1.55] text-slate-400">The authorization code is swapped for tokens by our Cloud Function, so your refresh tokens never sit in the browser.</p>
        </div>
        <motion.ol initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="flex flex-col gap-3">
          {STEPS.map(([title, body], i) => (
            <motion.li key={title} variants={clipReveal} custom={i}>
              <button onClick={() => setOpen(i)} aria-expanded={open === i}
                className={`flex w-full gap-5 rounded-2xl border p-6 text-left transition-colors ${open === i ? 'border-blue-500/40 bg-slate-900' : 'border-white/[0.06] hover:border-white/15'}`}>
                <span className={`du-display text-[32px] ${open === i ? 'text-blue-400' : 'text-slate-600'}`}>0{i + 1}</span>
                <span className="flex flex-col gap-2">
                  <span className="text-[18px] font-medium text-white">{title}</span>
                  <AnimatePresence initial={false}>
                    {open === i && (
                      <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}
                        className="block overflow-hidden text-[15px] leading-[1.6] text-slate-400">{body}</motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </button>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
