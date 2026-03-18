// Path: app/blog/page.tsx

import Link from 'next/link';
import Image from 'next/image';
import { neon } from '@neondatabase/serverless';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Charging Guides & Tips | Mcdodo UK Blog',
  description: 'Expert advice on USB-C cables, fast charging, and choosing the right charger for your devices. Guides for iPhone, MacBook, Samsung and more.',
  alternates: { canonical: 'https://www.mcdodo.co.uk/blog' },
};

const sql = neon(process.env.DATABASE_URL!);

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  keyword: string;
  published_at: string;
  reading_time_mins: number;
  featured_image: string | null;
}

async function getPosts(): Promise<Post[]> {
  try {
    const posts = await sql`
      SELECT id, title, slug, excerpt, keyword, published_at, reading_time_mins, featured_image
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
    `;
    return posts as Post[];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Charging Guides &amp; Tips
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Everything you need to know about USB-C cables, fast charging, and keeping your devices powered up.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No articles yet - check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-orange-200 transition"
              >
                {post.featured_image && (
                  <div className="relative w-full h-44">
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
                <div className="p-6">
                {post.keyword && (
                  <span className="inline-block text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full mb-3">
                    {post.keyword}
                  </span>
                )}
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition mb-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {new Date(post.published_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                  {post.reading_time_mins && <span>{post.reading_time_mins} min read</span>}
                </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
