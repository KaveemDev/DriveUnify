'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { getDashboardUrl } from '@/lib/auth-sync';
import './landing.css';

// Sample dataset matching kit.js
const SAMPLE_FILES = [
  { n: 'Invoice 0412, Northbeam.pdf', t: 'pdf', a: 'Work', m: 'Today', s: 0.19 },
  { n: 'Q3 board deck final.pptx', t: 'slide', a: 'Work', m: 'Today', s: 14.2 },
  { n: 'Lease agreement 2026.pdf', t: 'pdf', a: 'Personal', m: 'Yesterday', s: 2.4 },
  { n: 'Thesis chapter 3 draft.docx', t: 'doc', a: 'School', m: 'Mon', s: 0.82 },
  { n: 'Invoice March, freelance.pdf', t: 'pdf', a: 'Personal', m: '14 Oct', s: 0.2 },
  { n: 'Financial model v4.xlsx', t: 'sheet', a: 'Personal', m: '12 Oct', s: 1.1 },
  { n: 'Client brief, Halden.docx', t: 'doc', a: 'Work', m: '9 Oct', s: 0.4 },
  { n: 'Lab report 6, titration.docx', t: 'doc', a: 'School', m: '3 Oct', s: 1.3 },
  { n: 'Seminar slides week 9.pptx', t: 'slide', a: 'School', m: '30 Sep', s: 9.7 },
  { n: 'Pitch deck, seed round.pptx', t: 'slide', a: 'Work', m: '22 Sep', s: 21.4 },
  { n: 'Budget 2026.xlsx', t: 'sheet', a: 'Work', m: '18 Sep', s: 0.6 },
  { n: 'Passport scan.jpg', t: 'img', a: 'Personal', m: '2 Sep', s: 3.1 },
];

const ICON_MAP = {
  pdf: 'ph-file-pdf',
  slide: 'ph-presentation-chart',
  doc: 'ph-file-doc',
  sheet: 'ph-table',
  img: 'ph-image',
};

const formatSize = (mb) => {
  return mb < 1 ? `${Math.round(mb * 1000)} KB` : `${mb.toFixed(1)} MB`;
};

const formatGb = (gb) => {
  return gb >= 1024
    ? `${(gb / 1024).toFixed(1).replace('.0', '')} TB`
    : `${gb} GB`;
};

const STORAGE_PLANS = [
  { label: 'Free Google account', value: 15 },
  { label: 'Workspace Starter', value: 30 },
  { label: 'Google One 100 GB', value: 100 },
  { label: 'Google One 2 TB', value: 2048 },
];

const AVAILABLE_ACCOUNT_NAMES = [
  'Work',
  'Personal',
  'School',
  'Side project',
  'Old university',
  'Family',
];

// Reusable scroll animation container
const revealVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

// Sticky Card Component with Framer Motion Scroll Scaling
function StickyCardItem({ stepNumber, totalSteps, title, description, rightUi, zIndex }) {
  const cardRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start start', 'end start'],
  });

  // Scale down and fade card slightly when subsequent cards scroll over it
  const isLast = stepNumber === totalSteps;
  const scale = useTransform(scrollYProgress, [0, 1], [1, isLast ? 1 : 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, isLast ? 1 : 0.65]);

  return (
    <div
      ref={cardRef}
      className="stack-card md:sticky md:top-28"
      style={{ zIndex }}
    >
      <motion.div
        className="stack-inner"
        style={{ scale, opacity }}
      >
        <div className="step">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <div className="ui">{rightUi}</div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const [dashboardUrl, setDashboardUrl] = useState('https://dashboard.driveunify.com');
  const [theme, setTheme] = useState('dark');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Storage Calculator state
  const [accounts, setAccounts] = useState([
    ['Work', 30],
    ['Personal', 100],
    ['School', 15],
  ]);

  // Mini search demo state in Bento
  const [bentoSearchQuery, setBentoSearchQuery] = useState('thesis');

  // Initialize theme & dashboard URL on mount
  useEffect(() => {
    setDashboardUrl(getDashboardUrl());

    try {
      const savedTheme = localStorage.getItem('du-theme');
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = isDark ? 'dark' : 'light';
        setTheme(initial);
        document.documentElement.dataset.theme = initial;
      }
    } catch (e) {
      // fallback
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem('du-theme', nextTheme);
    } catch (e) {}
  };

  // App preview filtered files
  const filteredFiles = SAMPLE_FILES.filter((f) => {
    if (!selectedAccount) return true;
    return f.a === selectedAccount;
  }).slice(0, 9);

  // Storage Calculator calculations
  const totalGb = accounts.reduce((sum, [, gb]) => sum + gb, 0);
  const remainingAccountName = AVAILABLE_ACCOUNT_NAMES.find(
    (name) => !accounts.some(([aName]) => aName === name)
  );

  const handlePlanChange = (index, value) => {
    const next = [...accounts];
    next[index][1] = Number(value);
    setAccounts(next);
  };

  const handleRemoveAccount = (index) => {
    if (accounts.length <= 1) return;
    const next = accounts.filter((_, i) => i !== index);
    setAccounts(next);
  };

  const handleAddAccount = () => {
    if (!remainingAccountName) return;
    setAccounts([...accounts, [remainingAccountName, 15]]);
  };

  // Mini search demo results in Bento
  const bentoResults = [
    { name: 'Thesis chapter 3 draft.docx', source: 'School' },
    { name: 'Thesis feedback.pdf', source: 'School' },
    { name: 'Thesis backup.docx', source: 'Personal' },
  ].filter(
    (item) =>
      !bentoSearchQuery ||
      item.name.toLowerCase().includes(bentoSearchQuery.toLowerCase())
  );

  return (
    <div className="wrap">
      {/* ── Top Navigation ── */}
      <nav className="top" aria-label="Main">
        <Link href="#" className="brand">
          <b aria-hidden="true" />
          DriveUnify
        </Link>

        <div className="links">
          <a href="#how">How it works</a>
          <a href="#storage">Storage</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>

        <div className="nav-right">
          <a
            className="signin"
            href={`${dashboardUrl}/login`}
          >
            Sign in
          </a>

          <button
            className="theme"
            onClick={toggleTheme}
            aria-label="Switch colour theme"
            type="button"
          >
            {theme === 'dark' ? (
              <i className="ph ph-sun text-yellow-400" />
            ) : (
              <i className="ph ph-moon" />
            )}
          </button>

          <a
            className="btn btn-primary"
            href={`${dashboardUrl}/login`}
          >
            Start free
          </a>

          {/* Mobile hamburger menu toggle */}
          <button
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-2)] text-[var(--ink)] ml-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <i className={`ph ${mobileMenuOpen ? 'ph-x' : 'ph-list'} text-xl`} />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 mb-6 shadow-xl"
          >
            <div className="flex flex-col gap-3 font-medium">
              <a
                href="#how"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[var(--surface-2)]"
              >
                How it works
              </a>
              <a
                href="#storage"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[var(--surface-2)]"
              >
                Storage
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[var(--surface-2)]"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-[var(--surface-2)]"
              >
                FAQ
              </a>
              <div className="pt-2 border-t border-[var(--line)] flex gap-2">
                <a
                  href={`${dashboardUrl}/login`}
                  className="btn btn-primary flex-1 justify-center !h-10 text-sm"
                >
                  Start free
                </a>
                <a
                  href={`${dashboardUrl}/login`}
                  className="btn btn-soft flex-1 justify-center !h-10 text-sm"
                >
                  Sign in
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Section: text left, photograph right ── */}
      <header className="hero">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 variants={revealVariants}>
            All your Drives, one place
          </motion.h1>

          <motion.p variants={revealVariants} className="sub">
            Browse, search and copy files across work, personal and school Drives
            without signing out once.
          </motion.p>

          <motion.div variants={revealVariants} className="ctas">
            <a className="btn btn-primary" href={`${dashboardUrl}/login`}>
              Start free
              <i className="ph ph-arrow-right" />
            </a>
            <a className="btn btn-soft" href="#app">
              See it work
            </a>
          </motion.div>
        </motion.div>

        <motion.figure
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <img
            src="https://picsum.photos/id/445/900/1125"
            width={900}
            height={1125}
            alt="A laptop on a home desk by a window"
            priority="true"
          />
        </motion.figure>
      </header>

      {/* ── App Window: interactive live mockup ── */}
      <motion.div
        id="app"
        className="window"
        aria-label="DriveUnify, all accounts"
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <aside>
          <p>Accounts</p>

          <button
            className="acct"
            aria-pressed={selectedAccount === ''}
            onClick={() => setSelectedAccount('')}
            type="button"
          >
            <span className="av">
              <i className="ph ph-stack" />
            </span>
            <span>
              All accounts
              <small>3 connected</small>
            </span>
          </button>

          <button
            className="acct"
            aria-pressed={selectedAccount === 'Work'}
            onClick={() => setSelectedAccount('Work')}
            type="button"
          >
            <span className="av">W</span>
            <span>
              Work
              <small>aarav@northbeam.studio</small>
            </span>
          </button>

          <button
            className="acct"
            aria-pressed={selectedAccount === 'Personal'}
            onClick={() => setSelectedAccount('Personal')}
            type="button"
          >
            <span className="av">P</span>
            <span>
              Personal
              <small>aarav.mehta@gmail.com</small>
            </span>
          </button>

          <button
            className="acct"
            aria-pressed={selectedAccount === 'School'}
            onClick={() => setSelectedAccount('School')}
            type="button"
          >
            <span className="av">S</span>
            <span>
              School
              <small>am2291@halden.edu</small>
            </span>
          </button>

          <div className="store">
            107.6 GB of 145 GB used
            <div className="bar">
              <i />
            </div>
          </div>
        </aside>

        <main>
          <div className="head">
            <h3 id="w-title">{selectedAccount || 'All accounts'}</h3>
            <span id="w-count">{filteredFiles.length} recent files</span>
          </div>

          <motion.div
            layout
            className="grid-files"
            id="w-files"
          >
            <AnimatePresence mode="popLayout">
              {filteredFiles.map((file) => (
                <motion.div
                  key={file.n}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className="fcard"
                >
                  <i className={`ph ${ICON_MAP[file.t] || 'ph-file'}`} />
                  <div>
                    <b>{file.n}</b>
                    <small>
                      {selectedAccount ? file.m : file.a} · {formatSize(file.s)}
                    </small>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </main>
      </motion.div>

      {/* ── Storage Calculator ── */}
      <section id="storage" aria-labelledby="calc-h">
        <div className="calc">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={containerVariants}
          >
            <motion.h2 id="calc-h" variants={revealVariants}>
              How much room do you really have?
            </motion.h2>
            <motion.p className="sub" variants={revealVariants}>
              Add the Google accounts you use. DriveUnify shows their space as
              one total.
            </motion.p>

            <motion.div className="rows" id="rows" variants={revealVariants}>
              <AnimatePresence>
                {accounts.map(([name, gb], idx) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="row"
                  >
                    <span className="av">{name[0]}</span>
                    <label htmlFor={`p${idx}`}>{name}</label>
                    <select
                      id={`p${idx}`}
                      value={gb}
                      onChange={(e) => handlePlanChange(idx, e.target.value)}
                    >
                      {STORAGE_PLANS.map((plan) => (
                        <option key={plan.label} value={plan.value}>
                          {plan.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="rm"
                      aria-label={`Remove ${name}`}
                      disabled={accounts.length === 1}
                      onClick={() => handleRemoveAccount(idx)}
                      type="button"
                    >
                      <i className="ph ph-x" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <motion.button
              variants={revealVariants}
              className="btn btn-soft add"
              id="add"
              disabled={!remainingAccountName}
              onClick={handleAddAccount}
              type="button"
            >
              <i className="ph ph-plus" />
              Add an account
            </motion.button>
          </motion.div>

          <motion.div
            className="readout"
            aria-live="polite"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              key={totalGb}
              initial={{ scale: 0.95, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="big"
              id="total"
            >
              {formatGb(totalGb)}
            </motion.div>
            <p id="total-sub">
              across {accounts.length} Google account
              {accounts.length === 1 ? '' : 's'}
            </p>

            <div className="segs" id="segs">
              {accounts.map(([, gb], i) => (
                <motion.i
                  key={i}
                  layout
                  style={{
                    flexGrow: gb,
                    opacity: 1 - i * 0.14,
                  }}
                  transition={{ duration: 0.4 }}
                />
              ))}
            </div>

            <p className="note" id="note">
              {totalGb > 15
                ? `That is ${formatGb(totalGb - 15)} more than one free Google account.`
                : 'Add another account to see them combined.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Bento: four cells for four jobs ── */}
      <section aria-labelledby="jobs-h" style={{ paddingTop: 0 }}>
        <motion.h2
          id="jobs-h"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Everything in one window
        </motion.h2>

        <motion.div
          className="bento"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={containerVariants}
        >
          {/* Cell 1: Unified Search */}
          <motion.div variants={revealVariants} className="cell b-search">
            <h3>Find any file from one search box</h3>
            <p>
              Results come back from every account, labelled with where they
              live.
            </p>
            <div className="mini">
              <div className="in">
                <i className="ph ph-magnifying-glass" />
                <input
                  type="text"
                  value={bentoSearchQuery}
                  onChange={(e) => setBentoSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="bg-transparent border-none outline-none w-full text-inherit font-inherit"
                />
              </div>
              <ul>
                {bentoResults.length > 0 ? (
                  bentoResults.map((res) => (
                    <li key={res.name}>
                      {res.name}
                      <span>{res.source}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-[var(--muted)]">No matching files found</li>
                )}
              </ul>
            </div>
          </motion.div>

          {/* Cell 2: Photo */}
          <motion.div variants={revealVariants} className="cell b-photo">
            <img
              src="https://picsum.photos/id/20/700/900"
              width={700}
              height={900}
              alt="A study desk with books, a notebook and a phone"
              loading="lazy"
            />
            <div>
              <h3>Coursework, client work, life admin</h3>
              <p style={{ marginTop: '10px' }}>
                Each kept in its own account. All of it one search away.
              </p>
            </div>
          </motion.div>

          {/* Cell 3: Direct Server Copy */}
          <motion.div variants={revealVariants} className="cell b-copy">
            <h3>Copy between accounts</h3>
            <p>
              Google copies the file on its side. Nothing passes through your
              laptop.
            </p>
            <div className="num">0 bytes</div>
          </motion.div>

          {/* Cell 4: Preview In Place */}
          <motion.div variants={revealVariants} className="cell b-prev">
            <h3>Preview in place</h3>
            <div className="types">
              <span>
                <i className="ph ph-file-pdf" />
                PDF
              </span>
              <span>
                <i className="ph ph-file-doc" />
                Docs
              </span>
              <span>
                <i className="ph ph-table" />
                Sheets
              </span>
              <span>
                <i className="ph ph-image" />
                Photos
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Sticky Stack: three steps pin and stack ── */}
      <section
        id="how"
        className="stack-wrap"
        aria-labelledby="how-h"
        style={{ paddingBottom: 0 }}
      >
        <motion.h2
          id="how-h"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Ready in about a minute
        </motion.h2>

        <div id="stack" className="relative mt-8">
          <StickyCardItem
            stepNumber={1}
            totalSteps={3}
            zIndex={1}
            title="Sign in with Google"
            description="Use the account you open most days. It becomes your DriveUnify login."
            rightUi={
              <>
                <div
                  className="gbtn"
                  onClick={() => window.open(`${dashboardUrl}/login`, '_self')}
                >
                  <i className="ph ph-google-logo text-blue-500" />
                  Continue with Google
                </div>
                <small>We never see your Google password.</small>
              </>
            }
          />

          <StickyCardItem
            stepNumber={2}
            totalSteps={3}
            zIndex={2}
            title="Add your other accounts"
            description="One Google consent screen each, for as many accounts as you have."
            rightUi={
              <>
                <div className="line">
                  <span className="av">W</span>
                  aarav@northbeam.studio
                  <em>Connected</em>
                </div>
                <div className="line">
                  <span className="av">P</span>
                  aarav.mehta@gmail.com
                  <em>Connected</em>
                </div>
                <div className="line">
                  <span className="av">S</span>
                  am2291@halden.edu
                  <em className="wait">Waiting</em>
                </div>
              </>
            }
          />

          <StickyCardItem
            stepNumber={3}
            totalSteps={3}
            zIndex={3}
            title="Search, preview and copy"
            description="Everything you own shows up together. Move a file to another account in two clicks."
            rightUi={
              <>
                <div className="line">
                  <i className="ph ph-presentation-chart text-indigo-500" />
                  Q3 board deck final.pptx
                  <em>Copied</em>
                </div>
                <div className="line">
                  <i className="ph ph-file-pdf text-rose-500" />
                  Lease agreement 2026.pdf
                  <em className="wait">Personal</em>
                </div>
                <div className="line">
                  <i className="ph ph-file-doc text-blue-500" />
                  Thesis chapter 3 draft.docx
                  <em className="wait">School</em>
                </div>
              </>
            }
          />
        </div>
      </section>

      {/* ── Pricing: one plan ── */}
      <section id="pricing" className="price" aria-labelledby="price-h">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 id="price-h">Free while we are in early access</h2>
          <p className="sub">
            Every feature on this page is included. You will hear from us before
            anything changes.
          </p>
        </motion.div>

        <motion.div
          className="plan"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="amt">
            Free <span>during early access</span>
          </div>
          <ul>
            <li>
              <i className="ph ph-check" />
              Unlimited Google accounts
            </li>
            <li>
              <i className="ph ph-check" />
              Search across every account
            </li>
            <li>
              <i className="ph ph-check" />
              Copy between accounts, server-side
            </li>
            <li>
              <i className="ph ph-check" />
              Uploads up to 5 GB that resume
            </li>
          </ul>
          <a className="btn btn-primary" href={`${dashboardUrl}/login`}>
            Start free
            <i className="ph ph-arrow-right" />
          </a>
        </motion.div>
      </section>

      {/* ── FAQ: questions and answers side by side ── */}
      <section id="faq" aria-labelledby="faq-h" style={{ paddingTop: 0 }}>
        <motion.h2
          id="faq-h"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Questions
        </motion.h2>

        <motion.div
          className="qa"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={containerVariants}
        >
          <motion.div variants={revealVariants}>
            <h3>Which clouds does it support?</h3>
            <p>
              Google Drive, personal and Workspace. OneDrive and Dropbox are
              next.
            </p>
          </motion.div>

          <motion.div variants={revealVariants}>
            <h3>What can DriveUnify see?</h3>
            <p>
              What you can see in Drive, so it can list, preview and copy for you.
              File contents are never stored on our servers.
            </p>
          </motion.div>

          <motion.div variants={revealVariants}>
            <h3>Where are my sign-in tokens kept?</h3>
            <p>
              On our server, in a database path that browser code cannot read or
              write.
            </p>
          </motion.div>

          <motion.div variants={revealVariants}>
            <h3>How do I disconnect an account?</h3>
            <p>From Settings. The token is revoked with Google and deleted.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Close Banner ── */}
      <section style={{ paddingTop: 0 }}>
        <motion.div
          className="close"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2>Stop signing out to find a file</h2>
          <a className="btn btn-primary" href={`${dashboardUrl}/login`}>
            Start free
            <i className="ph ph-arrow-right" />
          </a>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <span>© 2026 DriveUnify</span>
        <nav aria-label="Footer">
          <Link href="/docs">Docs</Link>
          <Link href="/help">Help</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/legal">Privacy</Link>
          <Link href="/legal">Terms</Link>
        </nav>
        <span>Placeholder photos via Picsum</span>
      </footer>
    </div>
  );
}
