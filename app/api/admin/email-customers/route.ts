// Path: app/api/admin/email-customers/route.ts

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { emails, subject, body } = await request.json();

    if (!emails || !subject || !body) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Create transporter using your Gmail credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Add to .env.local: your@gmail.com
        pass: process.env.EMAIL_PASS, // Add to .env.local: your app password
      },
    });

    // Send email to all customers (BCC for privacy)
    await transporter.sendMail({
      from: `"Mcdodo UK" <${process.env.EMAIL_USER}>`,
      bcc: emails.join(','), // BCC hides other recipients
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>'), // Convert line breaks to HTML
    });

    console.log(`[Email] Sent to ${emails.length} customers`);
    return NextResponse.json({ success: true, count: emails.length });

  } catch (error: any) {
    console.error('[Email] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}