'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const SHELL_PAGES = ['/features', '/integrations', '/about', '/docs', '/blog', '/help', '/contact', '/legal'];

export function ClientLayout({ children }) {
  const pathname = usePathname();
  // These pages render their own landing-style shell (see sections/PageShell).
  if (pathname === '/' || SHELL_PAGES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </>
  );
}
