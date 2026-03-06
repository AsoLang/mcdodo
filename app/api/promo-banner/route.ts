// Path: app/api/promo-banner/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'promo_banner'`;
    return NextResponse.json(rows[0]?.value ?? null, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(null);
  }
}
