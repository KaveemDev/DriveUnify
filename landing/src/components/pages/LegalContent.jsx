'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { springUI } from '@/lib/motion';

const SECTIONS = [
  ['files', 'Your files', 'DriveUnify is a window onto your drives, not a copy of them. Your browser talks to the Google Drive and Dropbox APIs directly; file contents are never stored on, or routed through, DriveUnify servers.'],
  ['data', 'What we store', 'Your DriveUnify login (via Firebase Authentication), the list of drives you have connected, and the OAuth tokens needed to reach them. A copy of your account list is cached in your browser so the dashboard opens quickly.'],
  ['tokens', 'OAuth tokens & scopes', 'Each provider asks for your consent on its own screen. Google Drive is granted full Drive access so DriveUnify can browse, rename, move and copy your existing files. Refresh tokens are exchanged and kept by server-only Cloud Functions; Firestore security rules stop any client, including yours, from reading them. Your browser only ever holds short-lived access tokens.'],
  ['copying', 'Cross-drive copies', 'To copy between two Google accounts, DriveUnify briefly shares the file with the destination account, asks Google to copy it, then removes the share. Copies involving Dropbox stream through your browser’s memory in 8 MiB chunks and are never written to disk.'],
  ['disconnect', 'Disconnecting & deletion', 'Choose “Disconnect” on any account to revoke its token with the provider and delete our stored copy immediately. Your files are untouched. To delete your DriveUnify account entirely, contact us and we will remove everything we hold about you.'],
  ['terms', 'Using DriveUnify', 'DriveUnify is provided as is. You remain responsible for the content in your drives and for complying with the terms of Google, Dropbox and any organisation that manages your accounts. Don’t use DriveUnify to access drives you aren’t authorised to use.'],
  ['changes', 'Changes to this page', 'If we change how your data is handled, we will update this page and the date at the top before the change takes effect.'],
  ['contact', 'Contact', 'Questions about privacy or this policy: privacy@driveunify.com. Security reports: security@driveunify.com.'],
];

export function LegalBody() {
  const [active, setActive] = useState(SECTIONS[0][0]);

  // Scroll-spy: highlight the section nearest the top third of the viewport.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-30% 0px -60% 0px' },
    );
    SECTIONS.forEach(([id]) => io.observe(document.getElementById(id)));
    return () => io.disconnect();
  }, []);

  return (
    <section className="px-4 pb-28 md:px-8">
      <div className="mx-auto grid max-w-[1120px] gap-12 md:grid-cols-[240px_1fr]">
        <nav aria-label="On this page" className="hidden flex-col gap-1 md:sticky md:top-24 md:flex md:self-start">
          {SECTIONS.map(([id, title], i) => (
            <a key={id} href={`#${id}`} className={`relative rounded-lg px-3 py-2 text-[14px] transition-colors ${active === id ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
              {active === id && <motion.span layoutId="legal-active" className="absolute inset-0 rounded-lg bg-slate-900 shadow-[inset_2px_0_0_#2348d8]" transition={{ type: 'spring', ...springUI }} />}
              <span className="relative"><span className="mr-2 text-slate-600">{String(i + 1).padStart(2, '0')}</span>{title}</span>
            </a>
          ))}
        </nav>
        <div className="flex max-w-[680px] flex-col">
          {SECTIONS.map(([id, title, body], i) => (
            <motion.article key={id} id={id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6 }}
              className="scroll-mt-28 border-b border-white/[0.06] py-10 first:pt-0">
              <span className="text-[13px] text-slate-500">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-white">{title}</h2>
              <p className="mt-4 text-[17px] leading-[1.7] text-slate-400">{body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
