// Path: app/api/track-visit/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    // Get visitor's IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';

    let country = 'Unknown';
    
    // Get country from IP (free API, no key needed)
    if (ip !== 'unknown') {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
          next: { revalidate: 86400 } // Cache for 24h
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          country = geoData.country_name || 'Unknown';
        }
      } catch {
        country = 'Unknown';
      }
    }

    // Update daily stats
    await sql`
      INSERT INTO daily_stats (date, visitors, page_views)
      VALUES (CURRENT_DATE, 1, 1)
      ON CONFLICT (date) 
      DO UPDATE SET 
        visitors = daily_stats.visitors + 1,
        page_views = daily_stats.page_views + 1
    `;

    // Track country
    await sql`
      INSERT INTO visitor_countries (date, country, visits)
      VALUES (CURRENT_DATE, ${country}, 1)
      ON CONFLICT (date, country) 
      DO UPDATE SET visits = visitor_countries.visits + 1
    `;

    return NextResponse.json({ success: true, country });
  } catch (error) {
    console.error('Track visit error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}