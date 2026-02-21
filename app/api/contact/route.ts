// Path: app/api/contact/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, orderNumber, token } = body;

    // 1. Validate Fields
    if (!name || !email || !message || !token) {
      return NextResponse.json(
        { error: 'Missing required fields or captcha' },
        { status: 400 }
      );
    }

    // 2. Verify Turnstile Token
    const verifyFormData = new FormData();
    verifyFormData.append('secret', process.env.TURNSTILE_SECRET_KEY!);
    verifyFormData.append('response', token);
    verifyFormData.append('remoteip', request.headers.get('x-forwarded-for') || '');

    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: verifyFormData,
    });

    const turnstileOutcome = await turnstileRes.json();

    if (!turnstileOutcome.success) {
      console.error('Turnstile verification failed:', turnstileOutcome);
      return NextResponse.json(
        { error: 'Invalid captcha. Please try again.' },
        { status: 403 }
      );
    }

    // Escape HTML special characters to prevent injection
    const escape = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // 3. Send Email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: [process.env.CONTACT_TO_EMAIL!],
      subject: `New Contact Form Submission from ${name}`,
      replyTo: email,
      text: `
        Name: ${name}
        Email: ${email}
        Order Number: ${orderNumber || 'N/A'}
        
        Message:
        ${message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escape(name)}</p>
        <p><strong>Email:</strong> ${escape(email)}</p>
        <p><strong>Order Number:</strong> ${escape(orderNumber || 'N/A')}</p>
        <br/>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escape(message)}</p>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}