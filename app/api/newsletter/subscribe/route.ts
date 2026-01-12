// Path: app/api/newsletter/subscribe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const sql = neon(process.env.DATABASE_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await sql`
      SELECT id, is_active FROM subscribers 
      WHERE email = ${email.toLowerCase()}
    `;

    if (existing.length > 0) {
      if (existing[0].is_active) {
        return NextResponse.json(
          { message: 'You are already subscribed!' },
          { status: 200 }
        );
      } else {
        // Reactivate subscription
        await sql`
          UPDATE subscribers 
          SET is_active = true, subscribed_at = NOW()
          WHERE email = ${email.toLowerCase()}
        `;
        
        await sendWelcomeEmail(email);
        
        return NextResponse.json(
          { success: true, message: 'Welcome back! Check your email for 10% off.' },
          { status: 200 }
        );
      }
    }

    // Insert new subscriber
    await sql`
      INSERT INTO subscribers (email, source)
      VALUES (${email.toLowerCase()}, 'newsletter')
    `;

    // Send welcome email
    await sendWelcomeEmail(email);

    return NextResponse.json(
      { success: true, message: 'Subscribed! Check your inbox for 10% off.' },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[Newsletter] Error:', error);
    
    if (error?.message?.includes('unique') || error?.message?.includes('duplicate')) {
      return NextResponse.json(
        { message: 'You are already subscribed!' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(email: string) {
  try {
    await resend.emails.send({
      from: 'Mcdodo UK <hello@mcdodo.co.uk>',
      to: email,
      subject: 'Welcome to Mcdodo UK - Here\'s Your 10% Off! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%); color: white; padding: 40px 20px; text-align: center; }
            .logo { font-size: 32px; font-weight: 900; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .discount-box { background: #fef3c7; border: 2px dashed #f59e0b; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
            .code { font-size: 28px; font-weight: bold; color: #ea580c; letter-spacing: 2px; background: white; padding: 15px 30px; border-radius: 8px; display: inline-block; margin: 15px 0; font-family: monospace; }
            .btn { display: inline-block; background: #ea580c; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Mcdodo UK</div>
              <p style="margin: 0; font-size: 18px;">Welcome to Premium Charging Accessories</p>
            </div>

            <div class="content">
              <h2 style="color: #111827; margin-top: 0;">Thanks for Subscribing! 🎉</h2>
              
              <p style="color: #4b5563; line-height: 1.6;">
                You're now part of the Mcdodo UK family! Here's your exclusive 10% discount code to use on your first order:
              </p>

              <div class="discount-box">
                <p style="margin: 0 0 10px 0; color: #92400e; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Discount Code</p>
                <div class="code">NEW10</div>
                <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">Valid for 30 days • Minimum order £10</p>
              </div>

              <p style="color: #4b5563; line-height: 1.6;">
                Ready to shop? Discover our premium collection of fast-charging cables, power adapters, and accessories designed for your lifestyle.
              </p>

              <div style="text-align: center;">
                <a href="https://mcdodo.co.uk/shop" class="btn">Shop Now</a>
              </div>

              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 16px;">What You'll Get:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                  <li>Exclusive deals and early access to new products</li>
                  <li>Tips and tricks for fast charging</li>
                  <li>Special birthday offers</li>
                  <li>Free shipping updates</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0 0 10px 0;">
                <strong>Mcdodo UK</strong> - Premium Charging Accessories
              </p>
              <p style="margin: 0 0 10px 0; font-size: 12px;">
                You're receiving this because you subscribed to our newsletter.
              </p>
              <p style="margin: 0;">
                <a href="https://mcdodo.co.uk" style="color: #ea580c; text-decoration: none;">Visit Website</a> |
                <a href="https://mcdodo.co.uk/contact" style="color: #ea580c; text-decoration: none;">Contact Us</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log('[Newsletter] Welcome email sent to:', email);
  } catch (error) {
    console.error('[Newsletter] Failed to send welcome email:', error);
  }
}