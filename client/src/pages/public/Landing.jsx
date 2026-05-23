import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Cloud, Search, FolderOpen, Share2 } from 'lucide-react';
import { AnimatedButton, GlassCard, SectionHeading, GradientText } from '../../components/ui';

const Landing = () => {
  return (
    <div className="w-full">
      {/* ── Hero Section ── */}
      <section className="relative pt-12 pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/15 blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">

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
              Connect multiple Google Drive accounts and manage all your files from one beautiful, unified dashboard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <AnimatedButton to="/login" size="lg" icon={ArrowRight}>
                Get Started — It's Free
              </AnimatedButton>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-4 text-sm text-slate-500"
            >
              Sign in with Google. No credit card needed.
            </motion.p>
          </div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 relative max-w-5xl mx-auto"
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-2 shadow-2xl shadow-blue-900/20">
              {/* Fake window chrome */}
              <div className="h-8 flex items-center gap-2 px-4 mb-2 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="flex-1 mx-4 h-5 bg-slate-800 rounded-md flex items-center justify-center">
                  <span className="text-[10px] text-slate-500">app.driveunify.com/dashboard</span>
                </div>
              </div>
              {/* Fake UI */}
              <div className="aspect-[16/9] rounded-xl bg-slate-800/40 border border-slate-700/30 flex overflow-hidden">
                <div className="w-48 border-r border-slate-700/50 p-4 hidden md:flex flex-col gap-4">
                  <div className="h-6 w-28 bg-slate-700/50 rounded skeleton" />
                  <div className="space-y-2.5 mt-2">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="h-5 w-full bg-slate-700/30 rounded skeleton" />
                    ))}
                  </div>
                  <div className="mt-auto h-16 w-full bg-slate-700/20 rounded-lg skeleton" />
                </div>
                <div className="flex-1 p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="h-7 w-32 bg-slate-700/50 rounded skeleton" />
                    <div className="flex gap-2">
                      <div className="h-7 w-24 bg-slate-700/30 rounded skeleton" />
                      <div className="h-7 w-20 bg-blue-600/40 rounded skeleton" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-20 rounded-xl bg-slate-700/20 skeleton" />
                    ))}
                  </div>
                  <div className="flex-1 rounded-xl bg-slate-700/15 skeleton min-h-[100px]" />
                </div>
              </div>
            </div>
            {/* Gradient fade at bottom to blend into page */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* ── Google Drive Badge ── */}
      <section className="py-8 border-y border-slate-800/50 bg-slate-900/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium text-slate-500 mb-6 uppercase tracking-widest">Currently supports</p>
          <div className="flex justify-center items-center">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 border border-slate-700">
              <Cloud size={20} className="text-blue-400" />
              <span className="font-semibold text-slate-200">Google Drive</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">Live</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/20 border border-slate-800 ml-4 opacity-40">
              <Cloud size={20} className="text-slate-500" />
              <span className="font-semibold text-slate-500">More providers</span>
              <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-medium">Coming soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-28 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <SectionHeading
            badge="What you can do"
            title="Everything in one"
            highlight="dashboard."
            description="DriveUnify brings all your Google Drive accounts together, so you spend less time switching tabs and more time getting things done."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard delay={0.1}>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-5">
                <Search size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Search Across Accounts</h3>
              <p className="text-slate-400">Find any file across all your connected Google Drive accounts instantly from a single search bar.</p>
            </GlassCard>

            <GlassCard delay={0.15}>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                <FolderOpen size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Multi-Account Manager</h3>
              <p className="text-slate-400">Connect your personal, work, and school Google Drive accounts and browse them all from one place.</p>
            </GlassCard>

            <GlassCard delay={0.2}>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-5">
                <Share2 size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Upload & Download</h3>
              <p className="text-slate-400">Upload files directly to any of your connected accounts and download anything with one click.</p>
            </GlassCard>

            <GlassCard delay={0.25} className="md:col-span-2 lg:col-span-3">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-4">Drag & Drop Uploads</h3>
                  <p className="text-slate-400 max-w-md">Simply drag your files anywhere onto the dashboard to start uploading to your selected Google Drive account. No complicated steps, just drop and go.</p>
                </div>
                <div className="flex-1 w-full">
                  <div className="h-44 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 border-dashed p-6 flex flex-col items-center justify-center gap-3">
                    <Cloud size={32} className="text-blue-400 opacity-60" />
                    <p className="text-slate-400 text-sm">Drop files anywhere to upload</p>
                    <div className="w-full max-w-xs">
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>report-Q4.pdf</span>
                        <span className="text-blue-400">84%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: '20%' }}
                          animate={{ width: '84%' }}
                          transition={{ duration: 2.5, ease: 'easeOut', repeat: Infinity, repeatType: 'reverse', repeatDelay: 1 }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto glass rounded-3xl p-10 md:p-16 border border-blue-500/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 pointer-events-none" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-5">Start managing smarter</h2>
            <p className="text-lg text-slate-400 mb-9 max-w-lg mx-auto">
              Connect your Google Drive accounts and experience the clarity of having everything in one place.
            </p>
            <AnimatedButton to="/login" size="lg" icon={ArrowRight}>
              Sign in with Google
            </AnimatedButton>
            <p className="mt-5 text-sm text-slate-500">Free to use. No credit card required.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
