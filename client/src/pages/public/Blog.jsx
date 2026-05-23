import React from 'react';
import { SectionHeading } from '../../components/ui';

const Blog = () => {
  const posts = [
    { title: 'The Future of Cloud Storage is Unified', category: 'Vision', date: 'Oct 12, 2024', image: 'from-blue-600 to-indigo-900' },
    { title: 'How we built our zero-knowledge encryption engine', category: 'Engineering', date: 'Sep 28, 2024', image: 'from-emerald-600 to-teal-900' },
    { title: 'Announcing DriveUnify 2.0', category: 'Product', date: 'Sep 15, 2024', image: 'from-purple-600 to-pink-900' },
  ];

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <SectionHeading
        badge="Blog"
        title="Thoughts on "
        highlight="the cloud."
        description="News, updates, and deep dives from the DriveUnify team."
      />
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post, i) => (
          <div key={i} className="group cursor-pointer">
             <div className={`aspect-video rounded-2xl mb-4 bg-gradient-to-br ${post.image} overflow-hidden relative`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
             </div>
             <div className="flex items-center gap-3 mb-2">
               <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{post.category}</span>
               <span className="text-xs text-slate-500">{post.date}</span>
             </div>
             <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">{post.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blog;
