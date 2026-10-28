'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cloud, Menu, X, ArrowRight, LogOut, LayoutDashboard } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  getCrossDomainSession,
  setCrossDomainSession,
  clearCrossDomainSession,
  getDashboardUrl,
} from '@/lib/auth-sync';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null); // filled from the auth listener; reading the cookie here breaks hydration
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!auth) return;
    let isInitial = true;
    // Live Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const session = getCrossDomainSession();
      const firstEvent = isInitial;
      isInitial = false;
      // Cookie gone or for another user → signed out / switched account on the dashboard.
      if (firebaseUser && firstEvent && session?.uid !== firebaseUser.uid) {
        signOut(auth); // listener fires again with null
        return;
      }
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setUser(userData);
        setCrossDomainSession(userData, idToken);
      } else {
        // Signed in on the dashboard only: show that user from the shared cookie
        setUser(session);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const dashUrl = getDashboardUrl();
    if (!auth || !googleProvider) {
      if (dashUrl && dashUrl !== window.location.origin && !dashUrl.includes('driveunify.com')) {
        window.location.href = `${dashUrl}/login`;
      } else {
        alert('Firebase Auth is not initialized. Please verify your Firebase environment variables.');
      }
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        const idToken = await result.user.getIdToken();
        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        };
        setCrossDomainSession(userData, idToken);
        setUser(userData);
        // Navigate directly to dashboard
        window.location.href = dashUrl;
      }
    } catch (err) {
      console.warn('Sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err?.code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        alert(`This domain (${host}) is not authorized in Firebase Console.\n\nTo fix:\n1. Open Firebase Console\n2. Go to Authentication > Settings > Authorized domains\n3. Click "Add domain" and add "${host}".`);
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        alert('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
        return;
      }
      // If dashboard is explicitly set to a custom external URL, redirect there as fallback
      if (dashUrl && dashUrl !== window.location.origin && !dashUrl.includes('driveunify.com')) {
        window.location.href = `${dashUrl}/login`;
      } else {
        alert(`Sign-in failed: ${err.message || 'Please check your configuration.'}`);
      }
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error(e);
      }
    }
    clearCrossDomainSession();
    setUser(null);
    setUserMenuOpen(false);
  };

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Integrations', path: '/integrations' },
    { name: 'About', path: '/about' },
    { name: 'Docs', path: '/docs' },
    { name: 'Blog', path: '/blog' },
  ];

  const dashboardUrl = getDashboardUrl();

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
            {user ? (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <a
                    href={dashboardUrl}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <LayoutDashboard size={15} />
                    <span>Dashboard</span>
                  </a>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-white hover:border-slate-500 transition-colors"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}</span>
                    )}
                  </button>
                </div>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-800 text-left">
                      <p className="text-sm font-medium text-white truncate">{user.displayName || 'Signed in'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <a
                      href={dashboardUrl}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors mt-1"
                    >
                      <LayoutDashboard size={15} />
                      Open Dashboard
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <a
                  href={`${dashboardUrl}/login`}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </a>
              </>
            )}
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
              {user ? (
                <>
                  <a
                    href={dashboardUrl}
                    className="w-full text-center bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm"
                  >
                    Go to Dashboard
                  </a>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-center text-slate-400 hover:text-white py-2 text-sm"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSignIn}
                    className="w-full text-center text-slate-300 hover:text-white py-2 text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <a
                    href={`${dashboardUrl}/login`}
                    className="w-full text-center bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm"
                  >
                    Get Started Free
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
