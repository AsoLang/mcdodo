// Path: app/api/track-visit/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  try {
    // Upsert: If today's row exists, increment. If not, create it.
    await sql`
      INSERT INTO daily_stats (date, visitors, page_views)
      VALUES (CURRENT_DATE, 1, 1)
      ON CONFLICT (date) 
      DO UPDATE SET 
        visitors = daily_stats.visitors + 1,
        page_views = daily_stats.page_views + 1
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }); // Fail silently to not break UI
  }
}