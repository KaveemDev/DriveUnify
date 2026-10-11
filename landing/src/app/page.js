'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Cloud, Search, FolderOpen, Share2, CopyPlus, Zap } from 'lucide-react';
import { AnimatedButton, GlassCard, SectionHeading, GradientText } from '@/components/ui';
import { getDashboardUrl } from '@/lib/auth-sync';

export default function Home() {
  const [dashboardUrl, setDashboardUrl] = useState('https://dashboard.driveunify.com');

  useEffect(() => {
    setDashboardUrl(getDashboardUrl());
  }, []);

  return (
    <div className="w-full">
      {/* ── Hero Section ── */}
      <section className="relative pt-8 pb-28 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/15 blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* New feature badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6"
            >
              <Zap size={13} className="text-indigo-400" />
              New — Cross-drive copy with zero local downloads
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.05]"
            >
              Your Cloud Storage,{' '}
              <GradientText variant="mixed">Unified.</GradientText>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto"
            >
              Connect multiple Google Drive accounts and seamlessly access, search, and manage all your files from one lightning-fast dashboard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href={`${dashboardUrl}/login`}
                className="inline-flex items-center justify-center font-semibold text-base px-7 py-3.5 gap-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all"
              >
                <span>Get Started — It's Free</span>
                <ArrowRight size={18} />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center font-medium text-base px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:-translate-y-0.5"
              >
                Explore Features
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-4 text-sm text-slate-400"
            >
              Sign in with Google. No credit card needed.
            </motion.p>
          </div>

          {/* Interactive Mock Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 relative max-w-5xl mx-auto"
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-2.5 shadow-2xl shadow-blue-900/30">
              {/* Window Bar */}
              <div className="h-8 flex items-center gap-2 px-4 mb-2 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="flex-1 mx-4 h-5 bg-slate-800 rounded-md flex items-center justify-center">
                  <span className="text-[11px] text-slate-400 font-mono">dashboard.driveunify.com</span>
                </div>
              </div>

              {/* Mock App Shell */}
              <div className="aspect-[16/9] rounded-xl bg-[#F7F7F9] text-[#15151C] flex overflow-hidden border border-slate-200 shadow-inner">
                {/* Left Mini Sidebar */}
                <div className="w-48 bg-white border-r border-[#E6E6EC] p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E6E6EC]">
                    <div className="w-6 h-6 rounded bg-[#4338CA] text-white flex items-center justify-center font-bold text-xs">D</div>
                    <span className="font-bold text-xs text-[#15151C]">DriveUnify</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="p-1.5 rounded-md bg-[#EEEDFB] text-[#4338CA] font-semibold flex items-center gap-2">
                      <span>•</span> Overview
                    </div>
                    <div className="p-1.5 rounded-md text-[#62627A] flex items-center gap-2">
                      <span>•</span> All Files
                    </div>
                    <div className="p-1.5 rounded-md text-[#62627A] flex items-center gap-2">
                      <span>•</span> Recent
                    </div>
                    <div className="p-1.5 rounded-md text-[#62627A] flex items-center gap-2">
                      <span>•</span> Shared
                    </div>
                  </div>
                  <div className="mt-auto p-2 bg-[#F7F7F9] rounded-lg text-[10px] text-[#62627A]">
                    <p className="font-semibold text-[#15151C]">Google Drive</p>
                    <div className="w-full h-1.5 bg-[#E6E6EC] rounded-full my-1 overflow-hidden">
                      <div className="w-3/5 h-full bg-[#4338CA] rounded-full" />
                    </div>
                    <span>93 GB of 150 GB</span>
                  </div>
                </div>

                {/* Right Mini Content */}
                <div className="flex-1 p-4 bg-[#F7F7F9] flex flex-col gap-3 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-[#15151C]">Good morning, Aarav</h4>
                      <p className="text-[11px] text-[#62627A]">3 drives connected · Live sync active</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-2.5 py-1 bg-[#4338CA] text-white rounded text-xs font-semibold">
                        + Connect Drive
                      </button>
                    </div>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-white p-2.5 rounded-lg border border-[#E6E6EC]">
                      <span className="text-[10px] text-[#62627A]">Storage used</span>
                      <p className="font-bold text-sm text-[#15151C]">186 GB</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#E6E6EC]">
                      <span className="text-[10px] text-[#62627A]">Available</span>
                      <p className="font-bold text-sm text-[#15151C]">214 GB</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#E6E6EC]">
                      <span className="text-[10px] text-[#62627A]">Connected</span>
                      <p className="font-bold text-sm text-[#15151C]">3 Accounts</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#E6E6EC]">
                      <span className="text-[10px] text-[#62627A]">Files indexed</span>
                      <p className="font-bold text-sm text-[#15151C]">24,310</p>
                    </div>
                  </div>

                  {/* Table Sample */}
                  <div className="bg-white rounded-lg border border-[#E6E6EC] p-3 flex-1">
                    <span className="font-semibold text-xs text-[#15151C] mb-2 block">Recent Files</span>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center py-1 border-b border-[#E6E6EC]/50">
                        <span className="font-medium text-[#15151C]">Q3-board-deck-final.pptx</span>
                        <span className="text-[#62627A]">Google · Work</span>
                        <span className="text-[#62627A]">14.2 MB</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#E6E6EC]/50">
                        <span className="font-medium text-[#15151C]">Brand-guidelines-2026.pdf</span>
                        <span className="text-[#62627A]">Google · Personal</span>
                        <span className="text-[#62627A]">6.8 MB</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="font-medium text-[#15151C]">Financial-model-v4.xlsx</span>
                        <span className="text-[#62627A]">Google · Studio</span>
                        <span className="text-[#62627A]">1.1 MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* ── Supported Providers Section ── */}
      <section className="py-8 border-y border-slate-800/60 bg-slate-900/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs font-semibold text-slate-400 mb-6 uppercase tracking-widest">
            Production Cloud Providers
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-800/80 border border-slate-700 shadow-sm">
              <Cloud size={18} className="text-blue-400" />
              <span className="font-semibold text-sm text-slate-200">Google Drive</span>
              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">Live</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-800/40 border border-slate-800 opacity-60">
              <Cloud size={18} className="text-slate-400" />
              <span className="font-semibold text-sm text-slate-400">OneDrive & Dropbox</span>
              <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-medium">Next Release</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-28 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <SectionHeading
            badge="Unified Productivity"
            title="Everything in one"
            gradientWord="intelligent dashboard."
            subtitle="DriveUnify eliminates tab overload and context switching by unifying all your Google Drive accounts into a fast, central control center."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-5">
                <Search size={22} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Global Search</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Find any document, sheet, slide, or PDF across all your connected accounts instantly from a universal search bar with keyboard shortcuts (⌘K).
              </p>
            </GlassCard>

            <GlassCard>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                <FolderOpen size={22} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Multi-Account Browsing</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Seamlessly toggle between work, school, and personal accounts or view all files in one unified stream without signing in and out.
              </p>
            </GlassCard>

            <GlassCard>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-5">
                <Share2 size={22} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Instant Preview & Actions</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Preview documents, star important files, rename folders, and download files directly with a single click.
              </p>
            </GlassCard>

            {/* Feature Spotlight: Cross-Drive Copy */}
            <GlassCard className="md:col-span-2 lg:col-span-3 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center relative z-10">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                    <CopyPlus size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Copy Between Drives — Zero Local Storage</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Transfer files and folders across accounts directly on the server without consuming bandwidth or disk space on your local computer.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> Google Docs, Sheets, and Slides copy directly via cloud APIs
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> Direct folder transfer with live progress tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> Choose destination folder with an intuitive directory browser
                    </li>
                  </ul>
                </div>

                <div className="w-full lg:w-96 rounded-2xl bg-slate-800/80 border border-slate-700/60 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-white">Transfer Status</span>
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">In Progress</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/40 text-xs">
                    <p className="font-medium text-white">Q3-Quarterly-Review.docx</p>
                    <p className="text-slate-400 mt-0.5">work@studio.com → personal@gmail.com</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Server copy</span>
                      <span className="text-indigo-400 font-semibold">78%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[78%] h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-3xl mx-auto rounded-3xl p-10 md:p-14 border border-blue-500/30 bg-gradient-to-br from-blue-900/20 via-slate-900/60 to-indigo-900/20 backdrop-blur-xl relative shadow-2xl">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Unify your cloud files today.
            </h2>
            <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of creators, professionals, and students who manage all their Google Drive accounts from DriveUnify.
            </p>
            <a
              href={`${dashboardUrl}/login`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-xl shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
            >
              <span>Get Started Free with Google</span>
              <ArrowRight size={18} />
            </a>
            <p className="mt-4 text-xs text-slate-400">
              No credit card required · Free tier included · Instant setup
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
