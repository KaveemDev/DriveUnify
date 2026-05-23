import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Menu, X, ArrowRight } from 'lucide-react';
import { AnimatedButton } from '../components/ui';

export const MarketingLayout = ({ children }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Integrations', path: '/integrations' },
    { name: 'About', path: '/about' },
    { name: 'Docs', path: '/docs' },
    { name: 'Blog', path: '/blog' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Navigation */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div
            className={`mx-auto max-w-5xl flex items-center justify-between rounded-2xl border transition-all duration-300 px-5 py-2.5 ${
              scrolled
                ? 'bg-slate-900/80 backdrop-blur-md border-slate-700/60 shadow-lg'
                : 'bg-transparent border-transparent'
            }`}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-shadow">
                <Cloud size={17} />
              </div>
              <span className="font-bold text-lg tracking-tight">DriveUnify</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Log in
              </Link>
              <AnimatedButton to="/login" size="sm">
                Get Started
              </AnimatedButton>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="absolute top-full left-0 right-0 mt-1.5 px-4 md:hidden"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="text-base font-medium text-slate-300 hover:text-white px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="h-px bg-slate-800 my-1.5" />
                <div className="flex flex-col gap-2 px-1">
                  <Link to="/login" className="text-center font-medium text-slate-400 hover:text-white py-2 text-sm">
                    Log in
                  </Link>
                  <AnimatedButton to="/login" fullWidth>
                    Get Started — Free
                  </AnimatedButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full pt-28 pb-16 overflow-x-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#020617] border-t border-slate-800/50 pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 sm:col-span-3 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                  <Cloud size={17} />
                </div>
                <span className="font-bold text-lg tracking-tight">DriveUnify</span>
              </Link>
              <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                Unify all your Google Drive accounts into one seamless dashboard. Simple, fast, and free to start.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-4 text-sm uppercase tracking-wider">Product</h3>
              <ul className="flex flex-col gap-2.5">
                {[
                  { label: 'Features', path: '/features' },
                  { label: 'Integrations', path: '/integrations' },
                  { label: 'Documentation', path: '/docs' },
                  { label: 'Help Center', path: '/help' },
                ].map(({ label, path }) => (
                  <li key={label}>
                    <Link to={path} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-4 text-sm uppercase tracking-wider">Company</h3>
              <ul className="flex flex-col gap-2.5">
                {[
                  { label: 'About Us', path: '/about' },
                  { label: 'Blog', path: '/blog' },
                  { label: 'Contact', path: '/contact' },
                ].map(({ label, path }) => (
                  <li key={label}>
                    <Link to={path} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-4 text-sm uppercase tracking-wider">Legal</h3>
              <ul className="flex flex-col gap-2.5">
                {[
                  { label: 'Privacy Policy', path: '/legal' },
                  { label: 'Terms of Service', path: '/legal' },
                  { label: 'Cookie Policy', path: '/legal' },
                ].map(({ label, path }) => (
                  <li key={label}>
                    <Link to={path} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} DriveUnify. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
              <span className="text-sm text-slate-400">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
