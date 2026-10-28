import { PageShell, PageHero } from '@/components/sections/PageShell';
import { FaqList, HelpLinks } from '@/components/pages/HelpContent';

export const metadata = {
  title: 'Help',
  description: 'Answers about connecting Google Drive and Dropbox, cross-drive copy, and how DriveUnify handles your data.',
};

export default function HelpPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Help" lines={['Questions,', 'answered.']}>
        <p>Search below or pick a topic. If it isn’t here, we’re one message away.</p>
      </PageHero>
      <FaqList />
      <HelpLinks />
    </PageShell>
  );
}
