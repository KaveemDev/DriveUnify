import React from 'react';
import { SectionHeading, AnimatedButton, GlassCard } from '../../components/ui';

const Contact = () => {
  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <SectionHeading
        badge="Contact Us"
        title="Get in touch with "
        highlight="our team."
        description="Whether you have a question about features, trials, pricing, need a demo, or anything else, our team is ready to answer all your questions."
      />
      
      <div className="grid md:grid-cols-2 gap-12">
        <GlassCard>
          <form className="flex flex-col gap-4">
             <div className="flex flex-col gap-2">
               <label className="text-sm font-medium text-slate-300">Name</label>
               <input type="text" className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus-ring" placeholder="Jane Doe" />
             </div>
             <div className="flex flex-col gap-2">
               <label className="text-sm font-medium text-slate-300">Email</label>
               <input type="email" className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus-ring" placeholder="jane@company.com" />
             </div>
             <div className="flex flex-col gap-2">
               <label className="text-sm font-medium text-slate-300">Message</label>
               <textarea rows="4" className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus-ring resize-none" placeholder="How can we help?"></textarea>
             </div>
             <AnimatedButton fullWidth className="mt-4">Send Message</AnimatedButton>
          </form>
        </GlassCard>

        <div className="flex flex-col gap-8">
           <div>
             <h3 className="text-xl font-bold text-white mb-2">Sales Inquiries</h3>
             <p className="text-slate-400 mb-2">Looking for a custom plan or enterprise deployment?</p>
             <a href="mailto:sales@driveunify.com" className="text-blue-400 hover:text-blue-300">sales@driveunify.com</a>
           </div>
           <div>
             <h3 className="text-xl font-bold text-white mb-2">Technical Support</h3>
             <p className="text-slate-400 mb-2">Need help with an integration or experiencing issues?</p>
             <a href="mailto:support@driveunify.com" className="text-blue-400 hover:text-blue-300">support@driveunify.com</a>
           </div>
           <div className="p-6 rounded-xl bg-gradient-to-r from-blue-900/20 to-transparent border border-blue-500/20">
             <h3 className="text-lg font-bold text-white mb-2">Global Headquarters</h3>
             <p className="text-slate-400">123 Cloud Way<br/>San Francisco, CA 94107<br/>United States</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
