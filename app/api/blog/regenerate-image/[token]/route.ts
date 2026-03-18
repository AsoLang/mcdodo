// Path: app/api/blog/regenerate-image/[token]/route.ts
// Token-based image regeneration from email link (no login required)

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { put } from '@vercel/blob';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const posts = await sql`SELECT id, keyword, title, excerpt FROM blog_posts WHERE approval_token = ${token} LIMIT 1`;
  if (posts.length === 0) {
    return new NextResponse('Link expired or not found', { status: 404 });
  }

  const { id, keyword, title, excerpt } = posts[0];

  try {
    const imagePrompt = `Professional tech product photography style blog header image for an article about "${keyword}".
Show premium USB-C charging cables and fast chargers with modern orange and dark grey colour scheme.
Clean minimal background, high quality, no text overlays, no logos, photorealistic, 16:9 ratio,
tech e-commerce aesthetic matching Mcdodo UK brand colours (orange #ea580c, dark charcoal background).`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    );

    if (!geminiRes.ok) throw new Error('Gemini failed: ' + await geminiRes.text());

    const geminiData = await geminiRes.json();
    const part = geminiData?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    const b64 = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || 'image/png';
    if (!b64) throw new Error('No image returned');

    const buffer = Buffer.from(b64, 'base64');
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const filename = `blog/${Date.now()}-${(keyword || 'post').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${ext}`;
    const blob = await put(filename, buffer, { access: 'public', contentType: mimeType });

    await sql`UPDATE blog_posts SET featured_image = ${blob.url} WHERE id = ${id}`;

    // Re-send approval email with new image
    const baseUrl = 'https://www.mcdodo.co.uk';
    const approveUrl = `${baseUrl}/api/blog/approve/${token}?action=approve`;
    const rejectUrl = `${baseUrl}/api/blog/approve/${token}?action=reject`;
    const newImageUrl = `${baseUrl}/api/blog/regenerate-image/${token}`;
    const approvalEmail = process.env.BLOG_APPROVAL_EMAIL;
    if (approvalEmail) {
      await resend.emails.send({
        from: 'Mcdodo UK Blog <hello@mcdodo.co.uk>',
        to: approvalEmail,
        subject: `Blog Draft (New Image): ${title}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:0;">
  <div style="max-width:640px;margin:0 auto;background:white;">
    <div style="background:linear-gradient(135deg,#ea580c,#fb923c);padding:32px 24px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:1.4rem;">New Image Generated</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Keyword: <strong>${keyword}</strong></p>
    </div>
    <div style="padding:32px 24px;">
      <h2 style="color:#111;margin:0 0 8px;">${title}</h2>
      <img src="${blob.url}" alt="Featured image" style="width:100%;border-radius:8px;margin-bottom:24px;" />
      <p style="color:#6b7280;font-size:0.9rem;line-height:1.6;margin-bottom:24px;">${excerpt || ''}</p>
      <div style="text-align:center;margin-bottom:16px;">
        <a href="${approveUrl}" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;margin-right:8px;">Approve and Publish</a>
        <a href="${rejectUrl}" style="display:inline-block;background:#dc2626;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;margin-right:8px;">Reject</a>
        <a href="${newImageUrl}" style="display:inline-block;background:#374151;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;">New Image</a>
      </div>
    </div>
  </div>
</body></html>`,
      });
    }

    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Image Regenerated</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f0f0f;color:white;text-align:center;}
      .box{background:#1a1a1a;border-radius:16px;padding:48px;max-width:520px;}
      h1{color:#4ade80;margin-bottom:12px;}img{width:100%;border-radius:8px;margin:20px 0;}a{color:#ea580c;}</style></head>
      <body><div class="box">
        <h1>New image generated!</h1>
        <img src="${blob.url}" alt="New featured image" />
        <p style="color:#9ca3af;margin-bottom:24px;">Looking good? Go back to the email to approve or reject the article.</p>
        <a href="https://www.mcdodo.co.uk/admin/blog">View in Admin</a>
      </div></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    console.error('[RegenerateImage token] Error:', err);
    return new NextResponse('Image generation failed. Try again from the admin panel.', { status: 500 });
  }
}
