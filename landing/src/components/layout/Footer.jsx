'use client';
import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { LogoMark } from '@/components/ui/LogoMark';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md pt-16 pb-12 text-slate-400 text-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <LogoMark size={32} />
              <span className="font-bold text-lg text-white tracking-tight">DriveUnify</span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm mb-4 leading-relaxed">
              Unified cloud storage management. Connect multiple Google Drive accounts and seamlessly access all your files from one fast, beautiful interface.
            </p>
            <p className="text-xs text-slate-400">
              © 2026 DriveUnify. All rights reserved.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
              <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/legal" className="hover:text-white transition-colors">Privacy & Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>Built with precision for seamless cloud storage productivity.</p>
          <p className="flex items-center gap-1">
            Made with <Heart size={12} className="text-rose-500 fill-rose-500" /> by DriveUnify Team
          </p>
        </div>
      </div>
    </footer>
  );
};
