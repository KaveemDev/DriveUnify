'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard, Moon, Sun } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  getCrossDomainSession,
  setCrossDomainSession,
  clearCrossDomainSession,
  getDashboardUrl,
} from '@/lib/auth-sync';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(() => (typeof window !== 'undefined' ? getCrossDomainSession() : null));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }

  useEffect(() => {
    if (!auth) return;
    // Live Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
        const session = getCrossDomainSession();
        if (!session) {
          setUser(null);
        }
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
        window.location.href = dashUrl ? `${dashUrl}/dashboard` : '/dashboard';
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
    { name: 'How it works', path: '/#how' },
    { name: 'Pricing', path: '/#pricing' },
    { name: 'Docs', path: '/docs' },
  ];

  const dashboardUrl = getDashboardUrl();
  const dashboardHref = dashboardUrl ? `${dashboardUrl}/dashboard` : '/dashboard';
  const startHref = `${dashboardUrl}/login`;

  // Same key and class as the dashboard theme, so the choice carries over.
  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('themeMode', dark ? 'dark' : 'light'); } catch {}
  };

  return (
    <header className="sticky top-0 z-40 bg-page">
      <div className="mx-auto max-w-[1280px] px-4 md:px-8 h-[72px] flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 text-[1.1875rem] font-black tracking-[-0.03em] text-ink">
          <span aria-hidden="true" className="size-[22px] rounded-full bg-brand" />
          DriveUnify
        </Link>

        <nav aria-label="Main" className="hidden lg:flex items-center gap-8 font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className={`transition-colors ${pathname === link.path ? 'text-ink' : 'text-muted hover:text-ink'}`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Switch colour theme"
            className="size-11 grid place-items-center rounded-full bg-raised text-ink cursor-pointer transition-transform active:scale-95"
          >
            <Moon size={18} className="dark:hidden" />
            <Sun size={18} className="hidden dark:block" />
          </button>

          {user ? (
            <div className="relative hidden md:flex items-center gap-3">
              <a
                href={dashboardHref}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand text-brand-ink font-bold transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </a>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Account menu"
                aria-expanded={userMenuOpen}
                className="size-11 rounded-full bg-raised overflow-hidden grid place-items-center text-xs font-bold text-ink cursor-pointer"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="size-full object-cover" />
                ) : (
                  <span>{(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}</span>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-3xl bg-surface p-2 shadow-tinted">
                  <div className="px-3 py-2">
                    <p className="text-sm font-bold text-ink truncate">{user.displayName || 'Signed in'}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>
                  <a href={dashboardHref} className="flex items-center gap-2 px-3 py-2 text-sm text-ink rounded-xl hover:bg-raised">
                    <LayoutDashboard size={15} />
                    Open dashboard
                  </a>
                  <button onClick={handleSignOut} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-xl hover:bg-raised cursor-pointer">
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <button onClick={handleSignIn} className="font-medium text-muted hover:text-ink px-2 cursor-pointer">
                Sign in
              </button>
              <a
                href={startHref}
                className="inline-flex items-center h-11 px-5 rounded-full bg-brand text-brand-ink font-bold transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
              >
                Start free
              </a>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden size-11 grid place-items-center rounded-full text-ink cursor-pointer"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden mx-4 mb-4 p-5 rounded-3xl bg-surface shadow-tinted">
          <nav aria-label="Mobile" className="flex flex-col mb-4">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.path} className="py-3 text-lg font-medium text-ink">
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <a href={dashboardHref} className="h-12 grid place-items-center rounded-full bg-brand text-brand-ink font-bold">
                  Go to dashboard
                </a>
                <button onClick={handleSignOut} className="h-12 text-muted cursor-pointer">Sign out</button>
              </>
            ) : (
              <>
                <a href={startHref} className="h-12 grid place-items-center rounded-full bg-brand text-brand-ink font-bold">
                  Start free
                </a>
                <button onClick={handleSignIn} className="h-12 font-medium text-ink cursor-pointer">Sign in</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
