'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Copy, Check } from 'lucide-react';
import { ease, springUI } from '@/lib/motion';
import { SpotCard } from '@/components/sections/PageShell';

const TOPICS = [
  { id: 'general', label: 'General question', email: 'support@driveunify.com', hint: 'Getting started, features, something not working.' },
  { id: 'provider', label: 'Request a provider', email: 'support@driveunify.com', hint: 'Tell us which drive you want next and how you’d use it.' },
  { id: 'security', label: 'Security & privacy', email: 'security@driveunify.com', hint: 'Tokens, data handling, or reporting a vulnerability.' },
];

const field = 'w-full rounded-xl border border-white/[0.08] bg-[#f5f6f8] px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500/60';

export function ContactForm() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState(false);

  // No backend: hand the message to the visitor's mail app, prefilled.
  const submit = (e) => {
    e.preventDefault();
    const subject = `[${topic.label}] from ${name}`;
    window.location.href = `mailto:${topic.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    setOpened(true);
  };
  const copyEmail = () => navigator.clipboard?.writeText(topic.email).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  });

  return (
    <section aria-label="Contact form" className="px-4 pb-28 md:px-8">
      <div className="mx-auto grid max-w-[1120px] gap-6 md:grid-cols-[7fr_5fr]">
        <SpotCard className="bg-[#ffffff] p-6 md:p-10">
          <form onSubmit={submit} className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-[14px] text-slate-400">What’s it about?</legend>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button type="button" key={t.id} onClick={() => setTopic(t)} aria-pressed={topic.id === t.id}
                    className={`relative rounded-full border px-4 py-2 text-[14px] transition-colors ${topic.id === t.id ? 'border-transparent text-white' : 'border-white/[0.08] text-slate-400 hover:text-white'}`}>
                    {topic.id === t.id && <motion.span layoutId="contact-topic" className="absolute inset-0 rounded-full bg-blue-500" transition={{ type: 'spring', ...springUI }} />}
                    <span className="relative">{t.label}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.p key={topic.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2, ease }} className="text-[14px] text-slate-500">{topic.hint}</motion.p>
              </AnimatePresence>
            </fieldset>
            <label className="flex flex-col gap-2 text-[14px] text-slate-300">
              Your name
              <input required value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Jane Doe" autoComplete="name" />
            </label>
            <label className="flex flex-col gap-2 text-[14px] text-slate-300">
              Message
              <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className={`${field} resize-none`} placeholder="How can we help?" />
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="du-btn relative inline-flex items-center gap-2 overflow-hidden rounded-[10px] bg-blue-500 px-[22px] py-3.5 text-[15px] font-medium text-[#fff] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_32px_rgba(59,130,246,0.35)] hover:bg-blue-400">
                <Mail size={16} className="relative" /><span className="relative">Open in my email app</span>
              </motion.button>
              <AnimatePresence>
                {opened && (
                  <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="text-[14px] text-slate-400">
                    Nothing opened? Email <span className="text-white">{topic.email}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </form>
        </SpotCard>

        <div className="flex flex-col gap-4">
          <SpotCard className="flex flex-col gap-3 p-6">
            <span className="text-[14px] text-slate-400">Sending to</span>
            <AnimatePresence mode="wait">
              <motion.span key={topic.email} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease }}
                className="break-all text-[20px] font-medium text-white">{topic.email}</motion.span>
            </AnimatePresence>
            <button onClick={copyEmail} className="flex w-fit items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[13px] text-slate-300 hover:border-blue-500/60 hover:text-white">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy address'}
            </button>
          </SpotCard>
          <SpotCard className="flex flex-col gap-2 p-6">
            <span className="text-[16px] font-medium text-white">Quicker answers</span>
            <span className="text-[15px] leading-[1.6] text-slate-400">Most questions about connecting drives and copying files are already answered in <a href="/help" className="du-link text-blue-300">Help</a> and the <a href="/docs" className="du-link text-blue-300">Docs</a>.</span>
          </SpotCard>
        </div>
      </div>
    </section>
  );
}
