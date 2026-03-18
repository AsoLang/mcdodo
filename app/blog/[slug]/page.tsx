// Path: app/blog/[slug]/page.tsx

import { notFound } from 'next/navigation';
import { neon } from '@neondatabase/serverless';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 3600;

const sql = neon(process.env.DATABASE_URL!);

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  try {
    const posts = await sql`
      SELECT id, title, slug, content, excerpt, keyword, published_at, reading_time_mins, seo_title, seo_description, featured_image
      FROM blog_posts
      WHERE slug = ${slug} AND status = 'published'
      LIMIT 1
    `;
    return posts[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Not Found' };
  return {
    title: post.seo_title || `${post.title} | Mcdodo UK`,
    description: post.seo_description || post.excerpt,
    alternates: { canonical: `https://www.mcdodo.co.uk/blog/${slug}` },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      type: 'article',
      publishedTime: post.published_at,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    author: { '@type': 'Organization', name: 'Mcdodo UK' },
    publisher: {
      '@type': 'Organization',
      name: 'Mcdodo UK',
      logo: { '@type': 'ImageObject', url: 'https://www.mcdodo.co.uk/mcdodo-logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.mcdodo.co.uk/blog/${slug}` },
  };

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 pt-28 md:pt-32 pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/blog" className="text-orange-400 hover:text-orange-300 text-sm mb-4 inline-block transition">
            &larr; Back to guides
          </Link>
          {post.keyword && (
            <span className="inline-block text-xs font-semibold text-orange-400 bg-orange-950 px-3 py-1 rounded-full mb-4">
              {post.keyword}
            </span>
          )}
          <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Mcdodo (UK)</span>
            <span>-</span>
            <span>
              {new Date(post.published_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
            {post.reading_time_mins && (
              <>
                <span>-</span>
                <span>{post.reading_time_mins} min read</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured image */}
      {post.featured_image && (
        <div className="relative w-full h-64 md:h-96">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* Article */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-h3:text-lg
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900
            prose-ul:text-gray-700 prose-li:my-1"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="mt-12 bg-orange-50 border border-orange-100 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Shop Mcdodo UK</h3>
          <p className="text-gray-600 mb-5">Premium charging cables and fast chargers. Free UK delivery over 20 pounds.</p>
          <Link
            href="/shop"
            className="inline-block bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3 rounded-xl transition"
          >
            Browse Products
          </Link>
        </div>
      </section>
    </main>
  );
}
