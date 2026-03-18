// Path: app/api/admin/blog/generate/route.ts
// Generates a blog article draft using Claude API, saves to DB, emails for approval

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifySessionToken } from '@/lib/session';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { put } from '@vercel/blob';

const sql = neon(process.env.DATABASE_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);

const KEYWORDS = [
  'best USB-C cable UK',
  'best fast charger iPhone 15',
  'how to fast charge iPhone',
  'USB-C vs Lightning cable',
  'best MacBook charger UK',
  'what watt charger do I need',
  'best charging cable 2026',
  'why is my phone charging slowly',
  'best charger for Samsung S24',
  'iPhone 15 USB-C cable UK',
  'fastest USB-C cable UK',
  'Nintendo Switch charger cable',
  'best wireless charger UK',
  'USB-C cable lengths explained',
  'Mcdodo vs Anker cables',
  'how to charge MacBook faster',
  'best right angle USB-C cable UK',
  'USB-C cable not charging fix',
  'best multi port USB charger UK',
  'GaN charger vs regular charger',
];

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      keyword TEXT,
      status TEXT DEFAULT 'draft',
      approval_token TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      published_at TIMESTAMPTZ,
      seo_title TEXT,
      seo_description TEXT,
      reading_time_mins INT DEFAULT 6,
      featured_image TEXT
    )
  `;
  // Add column if table already existed without it
  try {
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_image TEXT`;
  } catch (_) {}
}

async function generateImage(keyword: string, title: string): Promise<string | null> {
  try {
    const imagePrompt = `Professional tech product photography style blog header image for an article about "${keyword}".
Show premium USB-C charging cables and fast chargers with modern orange and dark grey colour scheme.
Clean minimal background, high quality, no text overlays, no logos, photorealistic, 16:9 ratio,
tech e-commerce aesthetic matching Mcdodo UK brand colours (orange #ea580c, dark charcoal background).`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: imagePrompt }],
          parameters: { sampleCount: 1, aspectRatio: '16:9' },
        }),
      }
    );

    if (!geminiRes.ok) {
      console.error('[BlogGenerate] Gemini error:', await geminiRes.text());
      return null;
    }

    const geminiData = await geminiRes.json();
    const b64 = geminiData?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) return null;

    // Upload to Vercel Blob
    const buffer = Buffer.from(b64, 'base64');
    const filename = `blog/${Date.now()}-${keyword.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });

    return blob.url;
  } catch (err) {
    console.error('[BlogGenerate] Image generation failed:', err);
    return null;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  // Auth check - allow admin cookie or cron secret
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && request.headers.get('x-cron-secret') === cronSecret;
  if (!isCron) {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_auth')?.value;
    if (!token || !verifySessionToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    await ensureTable();

    // Pick next unused keyword
    const usedRows = await sql`SELECT keyword FROM blog_posts WHERE keyword IS NOT NULL`;
    const used = new Set(usedRows.map((r: any) => r.keyword));
    const next = KEYWORDS.find((k) => !used.has(k)) || KEYWORDS[0];

    // Build prompt
    const prompt = `You are an SEO content writer for Mcdodo UK, a British e-commerce brand selling premium USB-C cables, fast chargers, wireless chargers, and charging accessories at mcdodo.co.uk.

Write a high-quality SEO blog article targeting the keyword: "${next}"

Requirements:
- Length: 1,400 to 1,800 words
- Language: British English (use "colour", "favourite", etc.)
- Tone: helpful, knowledgeable, slightly conversational
- Structure: H1 title, then H2 and H3 subheadings, bullet lists where appropriate
- Naturally mention 2 to 3 Mcdodo products (cables, chargers, adapters) as recommendations
- End with a call-to-action paragraph linking to https://www.mcdodo.co.uk/shop
- NO em dashes (do not use --, use a comma or full stop instead)
- NO curly/smart quotes - use straight quotes only
- Format the output as clean HTML (h1, h2, h3, p, ul, li, strong, a tags only)
- Do NOT include <html>, <head>, <body>, or <style> tags - just the article content HTML
- The H1 should include the target keyword naturally
- Include the keyword phrase naturally 4 to 6 times throughout

Output only the HTML content, nothing else.`;

    // Call Anthropic API
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error('[BlogGenerate] Anthropic error:', err);
      return NextResponse.json({ error: 'Failed to generate article' }, { status: 500 });
    }

    const anthropicData = await anthropicRes.json();
    const content: string = anthropicData.content?.[0]?.text || '';

    if (!content) {
      return NextResponse.json({ error: 'No content returned' }, { status: 500 });
    }

    // Strip smart quotes just in case
    const cleanContent = content
      .replace(/\u2018/g, "'")
      .replace(/\u2019/g, "'")
      .replace(/\u201c/g, '"')
      .replace(/\u201d/g, '"')
      .replace(/\u2013/g, '-')
      .replace(/\u2014/g, '-');

    // Extract title from H1
    const titleMatch = cleanContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : next;

    // Build excerpt from first <p>
    const paraMatch = cleanContent.match(/<p[^>]*>(.*?)<\/p>/i);
    const excerpt = paraMatch
      ? paraMatch[1].replace(/<[^>]+>/g, '').slice(0, 200).trim()
      : '';

    // Generate unique slug
    let baseSlug = slugify(rawTitle);
    const existing = await sql`SELECT slug FROM blog_posts WHERE slug LIKE ${baseSlug + '%'}`;
    const slug = existing.length > 0 ? `${baseSlug}-${Date.now()}` : baseSlug;

    // Generate approval token
    const approvalToken = crypto.randomUUID();

    const seoTitle = `${rawTitle} | Mcdodo UK`;
    const seoDescription = excerpt.slice(0, 155);

    // Generate featured image via Gemini
    const featuredImage = await generateImage(next, rawTitle);

    // Save to DB
    const inserted = await sql`
      INSERT INTO blog_posts (title, slug, content, excerpt, keyword, status, approval_token, seo_title, seo_description, featured_image)
      VALUES (${rawTitle}, ${slug}, ${cleanContent}, ${excerpt}, ${next}, 'draft', ${approvalToken}, ${seoTitle}, ${seoDescription}, ${featuredImage})
      RETURNING id
    `;

    const postId = inserted[0]?.id;
    const baseUrl = 'https://www.mcdodo.co.uk';
    const approveUrl = `${baseUrl}/api/blog/approve/${approvalToken}?action=approve`;
    const rejectUrl = `${baseUrl}/api/blog/approve/${approvalToken}?action=reject`;
    const adminUrl = `${baseUrl}/admin/blog`;

    // Send approval email
    const approvalEmail = process.env.BLOG_APPROVAL_EMAIL;
    if (approvalEmail) {
      await resend.emails.send({
        from: 'Mcdodo UK Blog <hello@mcdodo.co.uk>',
        to: approvalEmail,
        subject: `Blog Draft Ready: ${rawTitle}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:0;">
  <div style="max-width:640px;margin:0 auto;background:white;">
    <div style="background:linear-gradient(135deg,#ea580c,#fb923c);padding:32px 24px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:1.4rem;">New Blog Draft Ready</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Keyword targeted: <strong>${next}</strong></p>
    </div>
    <div style="padding:32px 24px;">
      <h2 style="color:#111;margin:0 0 8px;">${rawTitle}</h2>
      <p style="color:#6b7280;font-size:0.9rem;line-height:1.6;margin-bottom:24px;">${excerpt}</p>

      ${featuredImage ? `<img src="${featuredImage}" alt="Featured image" style="width:100%;border-radius:8px;margin-bottom:24px;" />` : ''}
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;font-size:0.85rem;color:#374151;">
        <strong>Article preview (first 800 chars):</strong><br><br>
        ${cleanContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 800)}...
      </div>

      <div style="text-align:center;margin-bottom:16px;">
        <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:1rem;margin-right:8px;margin-bottom:8px;">Approve and Publish</a>
        <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:1rem;margin-right:8px;margin-bottom:8px;">Reject</a>
        <a href="https://www.mcdodo.co.uk/api/blog/regenerate-image/${approvalToken}" style="display:inline-block;background:#374151;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:1rem;margin-bottom:8px;">New Image</a>
      </div>

      <p style="text-align:center;font-size:0.8rem;color:#9ca3af;">
        Or <a href="${adminUrl}" style="color:#ea580c;">review in admin panel</a>
      </p>
    </div>
  </div>
</body>
</html>`,
      });
    }

    console.log(`[BlogGenerate] Draft created: "${rawTitle}" (keyword: ${next})`);
    return NextResponse.json({ success: true, id: postId, title: rawTitle, slug, keyword: next });
  } catch (error) {
    console.error('[BlogGenerate] Error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
