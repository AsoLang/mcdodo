// Path: app/api/admin/send-email/route.ts

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

const resend = new Resend(process.env.RESEND_API_KEY!);
const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'true';
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { campaignName, subject, html, recipients, isTest } = await req.json();

    // Create campaign record (skip for test emails)
    let campaignId = null;
    if (!isTest) {
      const campaign = await sql`
        INSERT INTO email_campaigns (campaign_name, subject, recipients_count)
        VALUES (${campaignName}, ${subject}, ${recipients.length})
        RETURNING id
      `;
      campaignId = campaign[0].id;
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Send emails in batches
    for (const recipient of recipients) {
      try {
        await resend.emails.send({
          from: 'Mcdodo UK <noreply@mcdodo.co.uk>',
          to: recipient,
          subject: subject,
          html: html,
          tags: campaignId ? [
            { name: 'campaign_id', value: String(campaignId) },
            { name: 'email', value: recipient }
          ] : []
        });

        results.success++;

        // Log to database (skip for test)
        if (!isTest && campaignId) {
          await sql`
            INSERT INTO email_sends (campaign_id, email, status)
            VALUES (${campaignId}, ${recipient}, 'sent')
          `;
        }

        // Rate limit: 10/second
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${recipient}: ${error.message}`);
      }
    }

    // Update campaign sent count
    if (!isTest && campaignId) {
      await sql`
        UPDATE email_campaigns 
        SET sent_count = ${results.success}
        WHERE id = ${campaignId}
      `;
    }

    return NextResponse.json({
      success: true,
      campaignId,
      results
    });

  } catch (error: any) {
    console.error('Send email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}