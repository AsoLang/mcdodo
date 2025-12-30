// Path: app/api/webhooks/resend/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
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