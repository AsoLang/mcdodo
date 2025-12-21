// Path: app/api/admin/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_auth');
    
    if (!adminAuth || adminAuth.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get product count
    const productCount = await sql`SELECT COUNT(*) as count FROM products`;
    
    // Get order count
    const orderCount = await sql`SELECT COUNT(*) as count FROM orders`;
    
    // Get unique customer count
    const customerCount = await sql`
      SELECT COUNT(DISTINCT customer_email) as count FROM orders
    `;

    return NextResponse.json({
      products: Number(productCount[0].count),
      orders: Number(orderCount[0].count),
      customers: Number(customerCount[0].count),
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({
      products: 0,
      orders: 0,
      customers: 0,
    });
  }
}