import React from 'react';
import { SectionHeading } from '../../components/ui';

const Legal = () => {
  return (
    <div className="container mx-auto px-4 max-w-3xl">
      <SectionHeading
        title="Legal & "
        highlight="Privacy"
        description="Everything you need to know about how we handle your data."
      />
      
      <div className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-a:text-blue-400">
         <div className="flex gap-4 border-b border-slate-800 mb-8 overflow-x-auto">
            <button className="px-4 py-2 border-b-2 border-blue-500 text-white whitespace-nowrap">Privacy Policy</button>
            <button className="px-4 py-2 border-b-2 border-transparent text-slate-400 hover:text-white whitespace-nowrap">Terms of Service</button>
            <button className="px-4 py-2 border-b-2 border-transparent text-slate-400 hover:text-white whitespace-nowrap">Cookie Policy</button>
            <button className="px-4 py-2 border-b-2 border-transparent text-slate-400 hover:text-white whitespace-nowrap">GDPR</button>
         </div>

         <h3>1. Introduction</h3>
         <p>At DriveUnify, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our service.</p>
         
         <h3>2. Information We Collect</h3>
         <p>We collect information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products, when you participate in activities on the Services, or otherwise when you contact us.</p>
         
         <h3>3. Zero-Knowledge Architecture</h3>
         <p>It is important to note that DriveUnify utilizes a zero-knowledge architecture for all file contents. We cannot see, read, or access the contents of the files you sync through our platform. All encryption keys are generated and stored client-side.</p>
      </div>
    </div>
  );
};

export default Legal;
