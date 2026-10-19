import Image from 'next/image';
import { ArrowRight, Check, FileText, FileSpreadsheet, FileImage, Search } from 'lucide-react';
import { getDashboardUrl } from '@/lib/auth-sync';
import { AppWindow } from '@/components/home/AppWindow';
import { StorageCalculator } from '@/components/home/StorageCalculator';
import { StepsStack } from '@/components/home/StepsStack';
import { Reveal, RevealItem } from '@/components/home/Reveal';

const h2 = 'text-[clamp(2.25rem,1.4rem+2.8vw,3.75rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink';
const btn = 'inline-flex h-[52px] items-center gap-2.5 whitespace-nowrap rounded-full px-6 font-bold transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.97]';

const faqs = [
  ['Which clouds does it support?', 'Google Drive, personal and Workspace. OneDrive and Dropbox are next.'],
  ['What can DriveUnify see?', 'What you can see in Drive, so it can list, preview and copy for you. File contents are never stored on our servers.'],
  ['Where are my sign-in tokens kept?', 'On our server, in a database path that browser code cannot read or write.'],
  ['How do I disconnect an account?', 'From Settings. The token is revoked with Google and deleted.'],
];

const included = ['Unlimited Google accounts', 'Search across every account', 'Copy between accounts, server-side', 'Uploads up to 5 GB that resume'];

export default function Home() {
  const startHref = `${getDashboardUrl()}/login`;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
      {/* Hero: text left, photograph right */}
      <header className="grid items-center gap-10 pb-16 pt-8 lg:grid-cols-[6fr_5fr] lg:gap-16 lg:pb-24 lg:pt-16">
        <div className="hero-rise">
          <h1 className="text-[10vw] font-bold leading-[1.02] tracking-[-0.035em] text-ink sm:text-[clamp(2.75rem,1.2rem+4vw,4.5rem)]">
            All your Drives, one place
          </h1>
          <p className="mt-5 max-w-[50ch] text-[1.1875rem] text-muted">
            Browse, search and copy files across work, personal and school Drives without signing out once.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={startHref} className={`${btn} flex-1 justify-center bg-brand text-brand-ink sm:flex-none`}>
              Start free
              <ArrowRight size={18} />
            </a>
            <a href="#app" className={`${btn} flex-1 justify-center bg-raised text-ink sm:flex-none`}>
              See it work
            </a>
          </div>
        </div>
        <figure className="hero-settle relative aspect-[4/3] overflow-hidden rounded-3xl bg-raised lg:aspect-[4/5]">
          {/* Placeholder photo: replace with a real product or customer photograph. */}
          <Image
            src="https://picsum.photos/id/445/900/1125"
            alt="A laptop on a home desk by a window"
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </figure>
      </header>

      <AppWindow />

      <section id="storage" aria-labelledby="calc-h" className="py-20 md:py-30">
        <StorageCalculator />
      </section>

      {/* Bento: four cells for four jobs */}
      <section aria-labelledby="jobs-h" className="pb-20 md:pb-30">
        <h2 id="jobs-h" className={h2}>Everything in one window</h2>
        <Reveal className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <RevealItem className="flex flex-col gap-3.5 rounded-3xl bg-surface p-8 md:col-span-2">
            <h3 className="text-[1.625rem] font-bold leading-tight tracking-[-0.03em] text-ink">Find any file from one search box</h3>
            <p className="max-w-[40ch] text-muted">Results come back from every account, labelled with where they live.</p>
            <div className="mt-2 rounded-2xl bg-page p-3.5">
              <div className="flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-3 text-ink">
                <Search size={18} className="text-muted" />
                thesis
              </div>
              <ul className="mt-2">
                {[['Thesis chapter 3 draft.docx', 'School'], ['Thesis feedback.pdf', 'School'], ['Thesis backup.docx', 'Personal']].map(([name, acct], i) => (
                  <li key={name} className={`flex justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[0.9375rem] text-ink ${i === 0 ? 'bg-brand-soft' : ''}`}>
                    {name}
                    <span className="text-muted">{acct}</span>
                  </li>
                ))}
              </ul>
            </div>
          </RevealItem>

          <RevealItem className="flex flex-col overflow-hidden rounded-3xl bg-surface lg:row-span-2">
            <div className="relative h-64 flex-none lg:h-auto lg:flex-1">
              <Image
                src="https://picsum.photos/id/20/700/900"
                alt="A study desk with books, a notebook and a phone"
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="px-7 pb-7 pt-6">
              <h3 className="text-[1.625rem] font-bold leading-tight tracking-[-0.03em] text-ink">Coursework, client work, life admin</h3>
              <p className="mt-2.5 text-muted">Each kept in its own account. All of it one search away.</p>
            </div>
          </RevealItem>

          <RevealItem className="flex flex-col gap-3.5 rounded-3xl bg-brand p-8 text-brand-ink">
            <h3 className="text-[1.625rem] font-bold leading-tight tracking-[-0.03em]">Copy between accounts</h3>
            <p className="opacity-85">Google copies the file on its side. Nothing passes through your laptop.</p>
            <div className="mt-auto text-[4rem] font-black leading-none tracking-[-0.05em]">0 bytes</div>
          </RevealItem>

          <RevealItem className="flex flex-col gap-3.5 rounded-3xl bg-raised p-8">
            <h3 className="text-[1.625rem] font-bold leading-tight tracking-[-0.03em] text-ink">Preview in place</h3>
            <div className="mt-auto flex flex-wrap gap-2.5">
              {[[FileText, 'PDF'], [FileText, 'Docs'], [FileSpreadsheet, 'Sheets'], [FileImage, 'Photos']].map(([Icon, label]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-[0.9375rem] font-medium text-ink">
                  <Icon size={18} className="text-brand" />
                  {label}
                </span>
              ))}
            </div>
          </RevealItem>
        </Reveal>
      </section>

      <section id="how" aria-labelledby="how-h" className="scroll-mt-24">
        <h2 id="how-h" className={h2}>Ready in about a minute</h2>
        <StepsStack />
      </section>

      <section id="pricing" aria-labelledby="price-h" className="grid scroll-mt-24 items-center gap-12 py-20 md:py-30 lg:grid-cols-[5fr_6fr]">
        <div>
          <h2 id="price-h" className={h2}>Free while we are in early access</h2>
          <p className="mt-4 max-w-[50ch] text-[1.1875rem] text-muted">Every feature on this page is included. You will hear from us before anything changes.</p>
        </div>
        <Reveal className="rounded-3xl bg-surface p-8 md:p-11">
          <RevealItem className="text-[4.5rem] font-black leading-none tracking-[-0.05em] text-ink">
            Free<span className="mt-3 block text-lg font-medium tracking-normal text-muted">during early access</span>
          </RevealItem>
          <RevealItem>
            <ul className="mb-8 mt-7 grid gap-3">
              {included.map((item) => (
                <li key={item} className="flex items-center gap-3 text-ink">
                  <Check size={18} className="flex-none text-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <a href={startHref} className={`${btn} bg-brand text-brand-ink`}>
              Start free
              <ArrowRight size={18} />
            </a>
          </RevealItem>
        </Reveal>
      </section>

      <section id="faq" aria-labelledby="faq-h" className="scroll-mt-24 pb-20 md:pb-30">
        <h2 id="faq-h" className={h2}>Questions</h2>
        <Reveal className="mt-12 grid gap-7 md:grid-cols-2 md:gap-x-16 md:gap-y-10">
          {faqs.map(([q, a]) => (
            <RevealItem key={q}>
              <h3 className="text-xl font-bold tracking-[-0.02em] text-ink">{q}</h3>
              <p className="mt-2 max-w-[46ch] text-muted">{a}</p>
            </RevealItem>
          ))}
        </Reveal>
      </section>

      <section aria-labelledby="close-h">
        <div className="grid items-end gap-8 rounded-3xl bg-brand-soft px-6 py-12 md:grid-cols-[1fr_auto] md:px-16 md:py-22">
          <h2 id="close-h" className={h2}>Stop signing out to find a file</h2>
          <a href={startHref} className={`${btn} justify-self-start bg-brand text-brand-ink`}>
            Start free
            <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </div>
  );
}
