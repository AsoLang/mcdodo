// Path: app/api/admin/customers/email/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const sql = neon(process.env.DATABASE_URL!);
const resend = new Resend(process.env.RESEND_API_KEY!);

// Throttle helper: delay between emails
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    // --- AUTH CHECK ---
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_auth');
    if (!adminAuth || adminAuth.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      campaignName,
      subject, 
      bodyHtml, 
      bodyText,
      testMode = false,
      testEmail,
      filterSegment // optional: 'all', 'has_orders', 'no_orders'
    } = await request.json();

    // Validation
    if (!campaignName || !subject || (!bodyHtml && !bodyText)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // --- GET RECIPIENTS ---
    let recipients: any[] = [];
    
    if (testMode && testEmail) {
      // Test mode: send only to specified email
      recipients = [{ email: testEmail, name: 'Test User' }];
    } else {
      // Production mode: get customers from DB
      let query = sql`
        SELECT DISTINCT c.email, c.billing_name as name
        FROM customers c
        WHERE c.email IS NOT NULL AND c.email != ''
      `;

      // Apply filters
      if (filterSegment === 'has_orders') {
        query = sql`
          SELECT DISTINCT c.email, c.billing_name as name
          FROM customers c
          INNER JOIN orders o ON (o.customer_email = c.email OR o.email = c.email)
          WHERE c.email IS NOT NULL AND c.email != ''
        `;
      } else if (filterSegment === 'no_orders') {
        query = sql`
          SELECT DISTINCT c.email, c.billing_name as name
          FROM customers c
          LEFT JOIN orders o ON (o.customer_email = c.email OR o.email = c.email)
          WHERE c.email IS NOT NULL AND c.email != '' AND o.id IS NULL
        `;
      }

      recipients = await query;
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
    }

    // --- CREATE LOG ENTRY ---
    const [logEntry] = await sql`
      INSERT INTO bulk_email_log (
        campaign_name,
        subject,
        body_html,
        body_text,
        recipient_count,
        filter_applied,
        status
      ) VALUES (
        ${campaignName},
        ${subject},
        ${bodyHtml || null},
        ${bodyText || null},
        ${recipients.length},
        ${filterSegment || 'all'},
        'sending'
      )
      RETURNING id
    `;

    const campaignId = logEntry.id;

    // --- SEND EMAILS ---
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    console.log(`[Bulk Email] Starting campaign: ${campaignName} to ${recipients.length} recipients`);

    for (const recipient of recipients) {
      try {
        await resend.emails.send({
          from: 'Mcdodo UK <support@mcdodo.co.uk>',
          to: recipient.email,
          subject: subject,
          html: bodyHtml || undefined,
          text: bodyText || bodyHtml?.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
        });

        sentCount++;
        console.log(`[Bulk Email] Sent to: ${recipient.email}`);

        // Throttle: 100ms delay = ~10 emails/second
        await delay(100);

      } catch (error: any) {
        failedCount++;
        const errorMsg = `${recipient.email}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`[Bulk Email] Failed:`, errorMsg);
      }
    }

    // --- UPDATE LOG ---
    await sql`
      UPDATE bulk_email_log
      SET 
        sent_count = ${sentCount},
        failed_count = ${failedCount},
        status = 'completed',
        completed_at = NOW()
      WHERE id = ${campaignId}
    `;

    console.log(`[Bulk Email] Campaign complete: ${sentCount} sent, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      campaignId,
      sentCount,
      failedCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : [], // Return first 10 errors
    });

  } catch (error: any) {
    console.error('[Bulk Email API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}