// Path: app/api/promo-banner/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const BANNER_CACHE_HEADER = 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800';
export const dynamic = 'force-static';
export const revalidate = 86400;

export async function GET() {
  try {
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'promo_banner'`;
    return NextResponse.json(rows[0]?.value ?? null, {
      headers: { 'Cache-Control': BANNER_CACHE_HEADER },
    });
  } catch {
    return NextResponse.json(null);
  }
}
