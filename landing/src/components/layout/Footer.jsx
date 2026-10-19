import Link from 'next/link';

const links = [
  { name: 'Features', href: '/features' },
  { name: 'Integrations', href: '/integrations' },
  { name: 'Docs', href: '/docs' },
  { name: 'Help', href: '/help' },
  { name: 'Blog', href: '/blog' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Privacy and terms', href: '/legal' },
];

export const Footer = () => (
  <footer className="mx-auto w-full max-w-[1280px] px-4 md:px-8 pt-14 pb-16 flex flex-col md:flex-row md:items-center justify-between gap-6 text-[0.9375rem] text-muted">
    <span>© 2026 DriveUnify</span>
    <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-ink transition-colors">
          {link.name}
        </Link>
      ))}
    </nav>
    <span>Placeholder photos via Picsum</span>
  </footer>
);
