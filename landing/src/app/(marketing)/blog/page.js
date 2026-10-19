import React from 'react';
import { SectionHeading } from '@/components/ui';

export const metadata = {
  title: 'Blog & Product Updates',
  description: 'Product releases, cloud architecture insights, and engineering updates from DriveUnify.',
};

const posts = [
  {
    title: 'How We Built Cross-Drive Copy with Zero Local Downloads',
    category: 'Engineering',
    date: 'Oct 10, 2024',
    excerpt: 'Deep dive into Google Drive files.copy API, server-side permissions exchange, and in-memory streams.',
  },
  {
    title: 'The Future of Cloud Storage is Unified & Multi-Account',
    category: 'Vision',
    date: 'Sep 28, 2024',
    excerpt: 'Why tab switching across work, student, and personal accounts is broken and how a unified layer fixes it.',
  },
  {
    title: 'Announcing DriveUnify 2.0: Instant Search and New UI',
    category: 'Product',
    date: 'Sep 15, 2024',
    excerpt: 'Introducing our new high-speed indexer, keyboard navigation, and streamlined dashboard layout.',
  },
];

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <SectionHeading
        badge="Insights"
        title="Engineering & "
        gradientWord="Product Blog"
        subtitle="Articles, release notes, and technical write-ups from the DriveUnify engineering team."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <div key={post.title} className="group rounded-2xl bg-surface border border-line p-5 hover:border-line transition-colors">
            <div className={`aspect-video rounded-xl mb-4 bg-brand-soft overflow-hidden relative flex items-end p-4`}>
              <span className="text-xs font-bold text-ink bg-surface px-3 py-1 rounded-full">
                {post.category}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2 text-xs text-muted">
              <span>{post.date}</span>
            </div>
            <h3 className="text-xl font-bold text-ink group-hover:text-brand transition-colors mb-2">
              {post.title}
            </h3>
            <p className="text-muted text-sm leading-relaxed">{post.excerpt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
