import { PageShell, PageHero } from '@/components/sections/PageShell';
import { Story, Principles, Timeline } from '@/components/pages/AboutContent';
import { Privacy } from '@/components/sections/Privacy';
import { FinalCTA } from '@/components/sections/FinalCTA';

export const metadata = {
  title: 'About',
  description: 'Why DriveUnify exists, the principles it is built on, and how it got here.',
};

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero eyebrow="About" lines={['Built because signing out', 'got old.']}>
        <p>DriveUnify is one calm place for every drive you own — without moving a single file.</p>
      </PageHero>
      <Story />
      <Principles />
      <Timeline />
      <Privacy />
      <FinalCTA />
    </PageShell>
  );
}
