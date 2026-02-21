// Path: app/api/webhooks/resend/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const sql = neon(process.env.DATABASE_URL!);
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify webhook signature
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET is not set');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let payload: any;
    try {
      payload = resend.webhooks.verify({
        payload: rawBody,
        headers: {
          id: req.headers.get('svix-id') ?? '',
          timestamp: req.headers.get('svix-timestamp') ?? '',
          signature: req.headers.get('svix-signature') ?? '',
        },
        webhookSecret: webhookSecret,
      });
    } catch {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const { type, data } = payload;

    // Extract campaign_id and email from tags
    const campaignTag = data.tags?.find((t: any) => t.name === 'campaign_id');
    const emailTag = data.tags?.find((t: any) => t.name === 'email');

    if (!campaignTag || !emailTag) {
      return NextResponse.json({ received: true });
    }

    const campaignId = parseInt(campaignTag.value);
    const email = emailTag.value;

    // Update email_sends based on event type
    switch (type) {
      case 'email.delivered':
        await sql`
          UPDATE email_sends 
          SET status = 'delivered', delivered_at = NOW()
          WHERE campaign_id = ${campaignId} AND email = ${email}
        `;
        
        // Update campaign stats
        await sql`
          UPDATE email_campaigns
          SET delivered_count = delivered_count + 1
          WHERE id = ${campaignId}
        `;
        break;

      case 'email.opened':
        await sql`
          UPDATE email_sends 
          SET status = 'opened', opened_at = NOW()
          WHERE campaign_id = ${campaignId} AND email = ${email}
        `;
        
        await sql`
          UPDATE email_campaigns
          SET opened_count = opened_count + 1
          WHERE id = ${campaignId}
        `;
        break;

      case 'email.clicked':
        await sql`
          UPDATE email_sends 
          SET status = 'clicked', clicked_at = NOW()
          WHERE campaign_id = ${campaignId} AND email = ${email}
        `;
        
        await sql`
          UPDATE email_campaigns
          SET clicked_count = clicked_count + 1
          WHERE id = ${campaignId}
        `;
        break;

      case 'email.bounced':
        await sql`
          UPDATE email_sends 
          SET status = 'bounced'
          WHERE campaign_id = ${campaignId} AND email = ${email}
        `;
        
        await sql`
          UPDATE email_campaigns
          SET bounced_count = bounced_count + 1
          WHERE id = ${campaignId}
        `;
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}