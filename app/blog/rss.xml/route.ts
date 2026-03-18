// Path: app/blog/rss.xml/route.ts
// RSS feed for published blog posts — consumed by OpenClaw for LinkedIn post drafting

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const baseUrl = 'https://www.mcdodo.co.uk';

  let posts: any[] = [];
  try {
    posts = await sql`
      SELECT title, slug, excerpt, featured_image, published_at, keyword
      FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 20
    `;
  } catch (_) {}

  const items = posts.map((p) => {
    const url = `${baseUrl}/blog/${p.slug}`;
    const pubDate = new Date(p.published_at).toUTCString();
    const image = p.featured_image
      ? `<enclosure url="${p.featured_image}" type="image/jpeg" />`
      : '';
    return `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${p.excerpt || ''}]]></description>
      <category><![CDATA[${p.keyword || ''}]]></category>
      ${image}
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mcdodo UK Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Charging guides, USB-C tips, and fast charging advice from Mcdodo UK</description>
    <language>en-gb</language>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
