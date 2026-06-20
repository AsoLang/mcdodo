// Path: app/api/admin/recompute-stock/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { verifySessionToken } from '@/lib/session';
import { isCronRequestAuthorized } from '@/lib/cron-auth';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_auth');
  return session ? await verifySessionToken(session.value) : false;
}

async function handleRecompute(req: Request) {
  try {
    if (!isCronRequestAuthorized(req) && !(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sql`
      SELECT p.id, COALESCE(SUM(pv.stock), 0)::int AS total_stock
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      GROUP BY p.id
    `;

    let updated = 0;
    for (const row of rows) {
      await sql`
        UPDATE products
        SET stock = ${row.total_stock}
        WHERE id = ${row.id}
      `;
      updated++;
    }

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error('Recompute stock error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return handleRecompute(req);
}

export async function GET(req: Request) {
  return handleRecompute(req);
}
