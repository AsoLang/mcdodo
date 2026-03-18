// Path: app/api/admin/blog/regenerate-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifySessionToken } from '@/lib/session';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, keyword } = await request.json();
  if (!id || !keyword) return NextResponse.json({ error: 'Missing id or keyword' }, { status: 400 });

  try {
    const imagePrompt = `Professional tech product photography style blog header image for an article about "${keyword}".
Show premium USB-C charging cables and fast chargers with modern orange and dark grey colour scheme.
Clean minimal background, high quality, no text overlays, no logos, photorealistic, 16:9 ratio,
tech e-commerce aesthetic matching Mcdodo UK brand colours (orange #ea580c, dark charcoal background).`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('[RegenerateImage] Gemini error:', err);
      return NextResponse.json({ error: 'Gemini failed', detail: err }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const part = geminiData?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    const b64 = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || 'image/png';
    if (!b64) return NextResponse.json({ error: 'No image returned' }, { status: 500 });

    const buffer = Buffer.from(b64, 'base64');
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const filename = `blog/${Date.now()}-${keyword.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${ext}`;
    const blob = await put(filename, buffer, { access: 'public', contentType: mimeType });

    await sql`UPDATE blog_posts SET featured_image = ${blob.url} WHERE id = ${id}`;

    return NextResponse.json({ success: true, url: blob.url });
  } catch (err) {
    console.error('[RegenerateImage] Error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
