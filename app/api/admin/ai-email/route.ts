// app/api/admin/ai-email/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_auth');

    if (!adminAuth || adminAuth.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    const systemPrompt = `Create a professional marketing email for Mcdodo UK (tech accessories brand).

Request: ${prompt}

Format EXACTLY as:

SUBJECT: [catchy subject under 50 chars]

HTML:
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;">
<tr><td style="background:linear-gradient(135deg,#ff6b35,#f7931e);padding:40px 30px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;">[Compelling Headline]</h1>
</td></tr>
<tr><td style="padding:40px 30px;">
<p style="font-size:16px;color:#333;line-height:1.6;">[Engaging content about the offer/product]</p>
</td></tr>
<tr><td style="padding:0 30px 40px;text-align:center;">
<a href="https://www.mcdodo.co.uk/shop" style="display:inline-block;background:#ff6b35;color:#fff;text-decoration:none;padding:16px 40px;border-radius:6px;font-weight:700;">Shop Now</a>
</td></tr>
<tr><td style="background:#f8f8f8;padding:30px;text-align:center;">
<p style="margin:0;color:#666;font-size:14px;">Mcdodo UK - Premium Tech Accessories</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const response = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/Meta-Llama-3-8B-Instruct',
          messages: [
            { role: 'system', content: 'You are a marketing email generator.' },
            { role: 'user', content: systemPrompt }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    const subjectMatch = content.match(/SUBJECT:\s*(.+)/i);
    const htmlMatch = content.match(/HTML:\s*([\s\S]+)/i);

    const subject = subjectMatch
      ? subjectMatch[1].trim()
      : 'Special Offer from Mcdodo';

    const html = htmlMatch ? htmlMatch[1].trim() : content;

    return NextResponse.json({ subject, html });
  } catch (error: any) {
    console.error('[AI Email] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
