// Path: app/api/admin/stats/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Auth check helper
async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function GET() {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [productCount] = await sql`SELECT COUNT(*) as count FROM products`;
    const [orderCount] = await sql`SELECT COUNT(*) as count FROM orders`;
    const [customerCount] = await sql`SELECT COUNT(DISTINCT email) as count FROM orders`;

    return NextResponse.json({
      products: Number(productCount.count),
      orders: Number(orderCount.count),
      customers: Number(customerCount.count),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}