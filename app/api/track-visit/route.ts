// Path: app/api/track-visit/route.ts
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const BOT_USER_AGENT = /bot|crawler|spider|slurp|preview|facebookexternalhit|headless|monitor/i;

export async function POST(req: Request) {
  try {
    const userAgent = req.headers.get('user-agent') || '';
    const fetchSite = req.headers.get('sec-fetch-site');
    if (BOT_USER_AGENT.test(userAgent) || (fetchSite && fetchSite !== 'same-origin')) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Vercel supplies this header without an external geo API call.
    const rawCountry = req.headers.get('x-vercel-ip-country')?.toUpperCase() || '';
    const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : 'Unknown';
    const isUK = country === 'GB';

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

    // Update both counters in one database round trip.
    await sql`
      WITH daily AS (
        INSERT INTO daily_stats (date, visitors, page_views)
        VALUES (CURRENT_DATE, 1, 1)
        ON CONFLICT (date) DO UPDATE SET
          visitors = daily_stats.visitors + 1,
          page_views = daily_stats.page_views + 1
        RETURNING date
      )
      INSERT INTO visitor_countries (date, country, visits)
      SELECT date, ${country}, 1 FROM daily
      ON CONFLICT (date, country) DO UPDATE SET
        visits = visitor_countries.visits + 1
    `;

    return NextResponse.json(
      { success: true, country },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Track visit error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
