// Path: app/api/admin/visitor-countries/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: Request) {
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

    const countries = await sql`
      SELECT 
        country,
        SUM(visits) as total_visits,
        COUNT(DISTINCT date) as active_days
      FROM visitor_countries
      WHERE date >= CURRENT_DATE - ${intervalSQL}::interval
      GROUP BY country
      ORDER BY total_visits DESC
      LIMIT 10
    `;

    return NextResponse.json(countries);
  } catch (error: any) {
    console.error('Visitor countries API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}