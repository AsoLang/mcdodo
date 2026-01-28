// Path: app/api/track-visit/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const vercelCountry = req.headers.get('x-vercel-ip-country');

    // Get visitor's IP (prioritize Vercel headers)
    const ip = req.headers.get('x-real-ip') || 
               req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               'unknown';

    let country = vercelCountry || 'Unknown';
    let isUK = vercelCountry === 'GB';
    
    // Skip country lookup for localhost/private IPs
    if (!vercelCountry && ip !== 'unknown' && !ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
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
            country = geoData.country_code || geoData.country_name || 'Unknown';
            isUK = geoData.country_code === 'GB' || geoData.country_name === 'United Kingdom';
          }
        }
      } catch (err) {
        console.warn('Geo lookup failed:', err);
      }
    }

    // Heavily sample non-UK traffic to reduce compute usage
    if (!isUK) {
      const nonUKSampleRate = 0.1; // track ~10% of non-UK visits
      if (Math.random() > nonUKSampleRate) {
        return NextResponse.json({ success: true, country, skipped: true });
      }
    }

    if (country === 'Unknown') {
      return NextResponse.json({ success: true, country, skipped: true });
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

    return NextResponse.json({ success: true, country, ip: ip.substring(0, 10) + '...' });
  } catch (error) {
    console.error('Track visit error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
