'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cloud, Menu, X, ArrowRight } from 'lucide-react';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Integrations', path: '/integrations' },
    { name: 'About', path: '/about' },
    { name: 'Docs', path: '/docs' },
    { name: 'Blog', path: '/blog' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-3' : 'py-5'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div
          className={`mx-auto max-w-5xl flex items-center justify-between rounded-2xl border transition-all duration-300 px-5 py-2.5 ${
            scrolled
              ? 'bg-slate-900/85 backdrop-blur-md border-slate-700/60 shadow-lg'
              : 'bg-slate-950/40 backdrop-blur-sm border-slate-800/40'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-shadow">
              <Cloud size={17} />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">DriveUnify</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.path
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Action */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://dashboard.driveunify.com/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </a>
            <a
              href="https://dashboard.driveunify.com/login"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white p-1"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 p-5 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl shadow-2xl">
            <nav className="flex flex-col gap-3 mb-5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  className="text-slate-300 hover:text-white py-2 text-base font-medium border-b border-slate-800/50"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2">
              <a
                href="https://dashboard.driveunify.com/login"
                className="w-full text-center text-slate-300 hover:text-white py-2 text-sm font-medium"
              >
                Sign In
              </a>
              <a
                href="https://dashboard.driveunify.com/login"
                className="w-full text-center bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                Get Started Free
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
