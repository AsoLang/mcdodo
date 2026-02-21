// Path: app/api/admin/campaigns/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'true';
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const campaigns = await sql`
      SELECT 
        id,
        campaign_name,
        subject,
        recipient_count,
        sent_count,
        failed_count,
        filter_applied,
        created_at,
        completed_at,
        status
      FROM bulk_email_log
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error('Campaigns API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}