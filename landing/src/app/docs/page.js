import { PageShell, PageHero } from '@/components/sections/PageShell';
import { DocsBrowser } from '@/components/pages/DocsContent';

export const metadata = {
  title: 'Docs',
  description: 'Connect Google Drive and Dropbox, search and copy across accounts, and learn how DriveUnify handles tokens and your data.',
};

export default function DocsPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Docs" lines={['Everything you need,', 'nothing you don’t.']}>
        <p>From your first connected drive to how tokens are stored. Filter the list or jump with the arrows at the bottom.</p>
      </PageHero>
      <DocsBrowser />
    </PageShell>
  );
}
