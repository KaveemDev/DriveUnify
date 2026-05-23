import React from 'react';
import { SectionHeading } from '../../components/ui';

const Documentation = () => {
  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <SectionHeading
        badge="Developers"
        title="API "
        highlight="Documentation"
        description="Build custom integrations and automate your workflows with our REST API."
      />
      <div className="flex gap-8 items-start">
         {/* Sidebar */}
         <div className="hidden md:block w-64 shrink-0 p-6 rounded-2xl border border-slate-800 bg-slate-900/50">
            <h4 className="text-sm font-bold text-slate-100 mb-4 uppercase tracking-wider">Getting Started</h4>
            <ul className="space-y-3 mb-8">
              <li className="text-blue-400 font-medium cursor-pointer">Authentication</li>
              <li className="text-slate-400 hover:text-slate-200 cursor-pointer">Rate Limits</li>
              <li className="text-slate-400 hover:text-slate-200 cursor-pointer">Pagination</li>
            </ul>
            <h4 className="text-sm font-bold text-slate-100 mb-4 uppercase tracking-wider">Endpoints</h4>
            <ul className="space-y-3">
              <li className="text-slate-400 hover:text-slate-200 cursor-pointer">Files</li>
              <li className="text-slate-400 hover:text-slate-200 cursor-pointer">Folders</li>
              <li className="text-slate-400 hover:text-slate-200 cursor-pointer">Providers</li>
            </ul>
         </div>

         {/* Content */}
         <div className="flex-1 min-w-0">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
              <p className="text-slate-400 mb-6">DriveUnify uses OAuth 2.0 and API keys to authenticate requests. You can view and manage your API keys in the dashboard.</p>
              
              <div className="rounded-xl overflow-hidden border border-slate-800 mb-8">
                 <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">bash</span>
                    <button className="text-xs text-slate-500 hover:text-white">Copy</button>
                 </div>
                 <pre className="p-4 bg-[#0d1117] overflow-x-auto">
                   <code className="text-sm text-slate-300">
{`curl -X GET https://api.driveunify.com/v1/files \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                   </code>
                 </pre>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4 mt-8">Bearer Tokens</h3>
              <p className="text-slate-400">All API requests must be made over HTTPS. Calls made over plain HTTP will fail. API requests without authentication will also fail.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Documentation;
