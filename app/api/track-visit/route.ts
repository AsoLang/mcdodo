// Path: app/api/track-visit/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    // Get visitor's IP (prioritize Vercel headers)
    const ip = req.headers.get('x-real-ip') || 
               req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               'unknown';

    let country = 'Unknown';
    
    // Skip country lookup for localhost/private IPs
    if (ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: { 'User-Agent': 'Mcdodo-UK-Analytics/1.0' }
        });
        
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          
          // Check for rate limit or error
          if (geoData.error) {
            console.warn('IP API error:', geoData.reason);
          } else {
            country = geoData.country_name || 'Unknown';
          }
        }
      } catch (err) {
        console.warn('Geo lookup failed:', err);
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

    // Track country (skip if Unknown to reduce noise)
    if (country !== 'Unknown') {
      await sql`
        INSERT INTO visitor_countries (date, country, visits)
        VALUES (CURRENT_DATE, ${country}, 1)
        ON CONFLICT (date, country) 
        DO UPDATE SET visits = visitor_countries.visits + 1
      `;
    }

    return NextResponse.json({ success: true, country, ip: ip.substring(0, 10) + '...' });
  } catch (error) {
    console.error('Track visit error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}