// Path: app/api/admin/visitor-countries/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'true';
}

export async function GET(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '7d';

  try {
    let intervalSQL = "7 days";

    switch (range) {
      case '1d':  intervalSQL = '1 day'; break;
      case '7d':  intervalSQL = '7 days'; break;
      case '1m':  intervalSQL = '30 days'; break;
      case '3m':  intervalSQL = '90 days'; break;
      case '1y':  intervalSQL = '1 year'; break;
      case 'all': intervalSQL = '100 years'; break;
    }

    const rows = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN country IN ('United Kingdom', 'GB', 'UK') THEN visits ELSE 0 END), 0) AS uk_visits,
        COALESCE(SUM(CASE WHEN country NOT IN ('United Kingdom', 'GB', 'UK') THEN visits ELSE 0 END), 0) AS other_visits
      FROM visitor_countries
      WHERE date >= CURRENT_DATE - ${intervalSQL}::interval
    `;

    const payload = {
      uk_visits: Number(rows[0]?.uk_visits || 0),
      other_visits: Number(rows[0]?.other_visits || 0),
    };

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error: any) {
    console.error('Visitor countries API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
