import React from 'react';
import { SectionHeading, GlassCard } from '../../components/ui';
import { Search, Book, MessageCircle, Video } from 'lucide-react';

const HelpCenter = () => {
  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <SectionHeading
        badge="Support"
        title="How can we "
        highlight="help you?"
        description="Search our knowledge base or browse categories below to find what you need."
      />
      
      <div className="max-w-2xl mx-auto relative mb-16">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search for articles, guides, or troubleshooting..." 
          className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white focus-ring text-lg"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
         <GlassCard className="text-center p-8">
           <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6"><Book size={32} /></div>
           <h3 className="text-xl font-bold text-white mb-2">Getting Started</h3>
           <p className="text-slate-400">Basic guides for setting up your DriveUnify account and connecting drives.</p>
         </GlassCard>
         <GlassCard className="text-center p-8">
           <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6"><Video size={32} /></div>
           <h3 className="text-xl font-bold text-white mb-2">Video Tutorials</h3>
           <p className="text-slate-400">Watch step-by-step videos on how to use advanced features.</p>
         </GlassCard>
         <GlassCard className="text-center p-8">
           <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6"><MessageCircle size={32} /></div>
           <h3 className="text-xl font-bold text-white mb-2">Community</h3>
           <p className="text-slate-400">Join our Discord to ask questions and share workflows.</p>
         </GlassCard>
      </div>
    </div>
  );
};

export default HelpCenter;
