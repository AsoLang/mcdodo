// Path: /app/api/admin/stats/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const [productsCount] = await sql`SELECT COUNT(*)::int as count FROM products WHERE visible = true`;
    const [ordersCount] = await sql`SELECT COUNT(*)::int as count FROM orders`;
    const [customersCount] = await sql`SELECT COUNT(DISTINCT email)::int as count FROM orders WHERE email IS NOT NULL`;

    return NextResponse.json({
      products: productsCount.count,
      orders: ordersCount.count,
      customers: customersCount.count,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}