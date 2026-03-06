// Path: app/api/admin/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin_auth');
  return adminAuth?.value ? await verifySessionToken(adminAuth.value) : false;
}

export async function GET() {
  if (!await isAuthenticated()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const rows = await sql`SELECT value FROM site_settings WHERE key = 'promo_banner'`;
  return NextResponse.json(rows[0]?.value ?? null);
}

export async function PUT(request: NextRequest) {
  if (!await isAuthenticated()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await request.json();

  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('promo_banner', ${JSON.stringify(body)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(body)}::jsonb, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
