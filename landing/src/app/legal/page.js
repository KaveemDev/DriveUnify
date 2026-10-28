import { PageShell, PageHero } from '@/components/sections/PageShell';
import { LegalBody } from '@/components/pages/LegalContent';

export const metadata = {
  title: 'Privacy & Terms',
  description: 'How DriveUnify handles your files, OAuth tokens and account data, and the terms for using it.',
};

export default function LegalPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Privacy & Terms · Updated Oct 29, 2026" lines={['Plain-English privacy.']}>
        <p>What we store, what we never touch, and how to take it all back.</p>
      </PageHero>
      <LegalBody />
    </PageShell>
  );
}
