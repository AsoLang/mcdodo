// Path: app/api/blog/post/[slug]/route.ts
// Public API to fetch a single blog post by slug

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const posts = await sql`
    SELECT id, title, slug, content, excerpt, keyword, published_at, reading_time_mins, seo_title, seo_description
    FROM blog_posts
    WHERE slug = ${slug} AND status = 'published'
    LIMIT 1
  `;
  if (posts.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(posts[0]);
}
