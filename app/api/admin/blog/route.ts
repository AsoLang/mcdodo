// Path: app/api/admin/blog/route.ts
// Admin API: list posts, update status, delete

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifySessionToken } from '@/lib/session';
import { cookies } from 'next/headers';

const sql = neon(process.env.DATABASE_URL!);

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  return token && verifySessionToken(token);
}

export async function GET(request: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';

  const posts = status === 'all'
    ? await sql`SELECT id, title, slug, excerpt, keyword, status, created_at, published_at, reading_time_mins FROM blog_posts ORDER BY created_at DESC`
    : await sql`SELECT id, title, slug, excerpt, keyword, status, created_at, published_at, reading_time_mins FROM blog_posts WHERE status = ${status} ORDER BY created_at DESC`;

  return NextResponse.json({ posts });
}

export async function PATCH(request: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });

  const validStatuses = ['draft', 'published', 'rejected'];
  if (!validStatuses.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  if (status === 'published') {
    await sql`UPDATE blog_posts SET status = 'published', published_at = NOW() WHERE id = ${id}`;
  } else {
    await sql`UPDATE blog_posts SET status = ${status} WHERE id = ${id}`;
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await sql`DELETE FROM blog_posts WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
