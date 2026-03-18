// Path: app/api/blog/approve/[token]/route.ts
// Public endpoint - handles approve/reject from email links

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const action = request.nextUrl.searchParams.get('action');

  if (!token || (action !== 'approve' && action !== 'reject')) {
    return new NextResponse('Invalid link', { status: 400 });
  }

  const posts = await sql`SELECT id, title FROM blog_posts WHERE approval_token = ${token}`;
  if (posts.length === 0) {
    return new NextResponse('Link expired or not found', { status: 404 });
  }

  const post = posts[0];

  if (action === 'approve') {
    await sql`UPDATE blog_posts SET status = 'published', published_at = NOW() WHERE id = ${post.id}`;
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Published</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f0f;color:white;text-align:center;}
      .box{background:#1a1a1a;border-radius:16px;padding:48px;max-width:480px;}
      h1{color:#4ade80;margin-bottom:12px;}a{color:#ea580c;}</style></head>
      <body><div class="box">
        <h1>Published!</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">"${post.title}" is now live on the blog.</p>
        <a href="https://www.mcdodo.co.uk/blog">View Blog</a> &nbsp;&middot;&nbsp;
        <a href="https://www.mcdodo.co.uk/admin/blog">Admin Panel</a>
      </div></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } else {
    await sql`UPDATE blog_posts SET status = 'rejected' WHERE id = ${post.id}`;
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rejected</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f0f;color:white;text-align:center;}
      .box{background:#1a1a1a;border-radius:16px;padding:48px;max-width:480px;}
      h1{color:#f87171;margin-bottom:12px;}a{color:#ea580c;}</style></head>
      <body><div class="box">
        <h1>Rejected</h1>
        <p style="color:#9ca3af;margin-bottom:24px;">"${post.title}" has been rejected.</p>
        <a href="https://www.mcdodo.co.uk/admin/blog">Admin Panel</a>
      </div></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
