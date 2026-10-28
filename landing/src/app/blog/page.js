import { PageShell, PageHero } from '@/components/sections/PageShell';
import { BlogList } from '@/components/pages/BlogContent';

export const metadata = {
  title: 'Blog',
  description: 'Product releases, engineering notes and design write-ups from DriveUnify.',
};

export default function BlogPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Blog" lines={['Notes from', 'the build.']}>
        <p>What shipped, how it works under the hood, and why we made the calls we did.</p>
      </PageHero>
      <BlogList />
    </PageShell>
  );
}
