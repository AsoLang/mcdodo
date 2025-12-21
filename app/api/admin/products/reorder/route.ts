// app/api/admin/products/reorder/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function POST(req: Request) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const order: unknown = body?.order;

    if (!Array.isArray(order) || order.length === 0 || !order.every((id) => typeof id === 'string')) {
      return NextResponse.json({ error: 'Invalid payload. Expected { order: string[] }' }, { status: 400 });
    }

    // Ensure column exists (fixes "column p.position does not exist")
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 999999
    `;

    // Update positions in one query (1-based ordinality)
    await sql`
      WITH data AS (
        SELECT * FROM unnest(${order}::text[]) WITH ORDINALITY AS t(id, ord)
      )
      UPDATE products p
      SET position = data.ord
      FROM data
      WHERE p.id = data.id
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving product order:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}
