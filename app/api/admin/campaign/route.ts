// Path: app/api/admin/campaigns/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const campaigns = await sql`
      SELECT 
        id,
        campaign_name,
        subject,
        recipients_count,
        sent_count,
        delivered_count,
        opened_count,
        clicked_count,
        bounced_count,
        created_at
      FROM email_campaigns
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error('Campaigns API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}