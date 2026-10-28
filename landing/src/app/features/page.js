import { PageShell, PageHero } from '@/components/sections/PageShell';
import { FeatureExplorer, Shortcuts } from '@/components/pages/FeaturesContent';
import { Bento } from '@/components/sections/Bento';
import { FinalCTA } from '@/components/sections/FinalCTA';

export const metadata = {
  title: 'Features',
  description:
    'Unified browsing and search across Google Drive and Dropbox, cross-drive copy with no downloads, a command palette, drag-and-drop uploads and combined storage.',
};

export default function FeaturesPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Features" lines={['Everything your drives', 'should do together.']}>
        <p>Browse, search, copy and upload across every Google Drive and Dropbox you own — without signing out once. Every demo below is live.</p>
      </PageHero>
      <FeatureExplorer />
      <Shortcuts />
      <Bento />
      <FinalCTA />
    </PageShell>
  );
}
