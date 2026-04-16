// Path: app/blog/page.tsx

import { neon } from '@neondatabase/serverless';
import { Metadata } from 'next';
import BlogClient from './BlogClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Charging Guides & Tips | Mcdodo (UK) Blog',
  description: 'Expert advice on USB-C cables, fast charging, and choosing the right charger for your devices. Guides for iPhone, MacBook, Samsung and more.',
  alternates: { canonical: 'https://www.mcdodo.co.uk/blog' },
};

const sql = neon(process.env.DATABASE_URL!);

async function getPosts() {
  try {
    const posts = await sql`
      SELECT id, title, slug, excerpt, keyword, published_at, reading_time_mins, featured_image
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
    `;
    return posts as any[];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gray-950 pt-32 md:pt-40 pb-16 md:pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-orange-600/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <span className="inline-block text-xs font-bold text-orange-400 bg-orange-950/80 border border-orange-900 px-4 py-1.5 rounded-full mb-5 tracking-wider uppercase">
            Charging Knowledge Hub
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Guides, Tips &amp; Advice
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto">
            Everything you need to know about USB-C cables, fast charging, and keeping your devices powered up.
          </p>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              {posts.length} article{posts.length !== 1 ? 's' : ''} published
            </span>
            <span>·</span>
            <span>Updated weekly</span>
          </div>
        </div>
      </section>

      <BlogClient posts={posts} />
    </main>
  );
}
