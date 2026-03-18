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

      {/* Hero with optional featured image background */}
      <section className="relative pt-24 md:pt-28 pb-10 md:pb-14 overflow-hidden bg-gray-950">
        {post.featured_image && (
          <>
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover opacity-25"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/80 to-gray-950" />
          </>
        )}
        <div className="relative max-w-3xl mx-auto px-5">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 text-sm mb-5 transition">
            &larr; Back to guides
          </Link>
          {post.keyword && (
            <span className="block w-fit text-xs font-semibold text-orange-400 bg-orange-950/80 border border-orange-900 px-3 py-1 rounded-full mb-4">
              {post.keyword}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-5">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
            <span className="font-medium text-gray-300">Mcdodo (UK)</span>
            <span className="text-gray-600">·</span>
            <span>
              {new Date(post.published_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
            {post.reading_time_mins && (
              <>
                <span className="text-gray-600">·</span>
                <span>{post.reading_time_mins} min read</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Article */}
      <section className="max-w-3xl mx-auto px-5 py-10 bg-white">
        {post.featured_image && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-10">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}
        <div
          className="prose prose-base md:prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
            prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
            prose-h3:text-lg prose-h3:mt-6
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-4
            prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:text-gray-700 prose-li:my-1.5
            prose-ol:text-gray-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-4
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-3
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:text-gray-800 [&_p]:leading-relaxed [&_p]:my-4 [&_p]:text-base
            [&_ul]:text-gray-800 [&_ul]:my-4 [&_ul]:pl-6 [&_ul]:list-disc
            [&_ol]:text-gray-800 [&_ol]:my-4 [&_ol]:pl-6 [&_ol]:list-decimal
            [&_li]:my-1.5 [&_li]:text-gray-800
            [&_strong]:text-gray-900 [&_strong]:font-semibold
            [&_a]:text-orange-600 [&_a]:no-underline hover:[&_a]:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-2xl p-7 md:p-10 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Shop Mcdodo (UK)</h3>
          <p className="text-gray-600 text-sm md:text-base mb-5">Premium charging cables and fast chargers. Free UK delivery over £20.</p>
          <Link
            href="/shop"
            className="inline-block bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3 rounded-xl transition text-sm md:text-base"
          >
            Browse Products
          </Link>
        </div>
      </section>
    </main>
  );
}
