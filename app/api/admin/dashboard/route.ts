// Path: app/api/admin/dashboard/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // 1. Get Summary Stats
    // FIX: Using 'total' (from your CSV) instead of 'total_amount'
    const revenueResult = await sql`
      SELECT SUM(total) as total 
      FROM orders 
      WHERE status = 'paid' OR status = 'shipped' OR status = 'delivered' OR status = 'confirmed'
    `;
    
    const ordersResult = await sql`SELECT COUNT(*) as count FROM orders`;
    const productsResult = await sql`SELECT COUNT(*) as count FROM products WHERE visible = true`;
    
    // 2. Get Low Stock Items (Threshold: 5)
    const lowStockItems = await sql`
      SELECT id, title, stock 
      FROM products 
      WHERE stock <= 5 
      ORDER BY stock ASC 
      LIMIT 5
    `;

    // 3. Get Recent Orders
    // FIX: Using 'total' aliased as 'total_amount' so the frontend works without changes
    const recentOrders = await sql`
      SELECT id, order_number, customer_email, total as total_amount, created_at, status 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    // 4. Get Sales Data for Chart (Last 7 Days)
    // FIX: Using 'total' here as well
    const salesData = await sql`
      SELECT 
        TO_CHAR(created_at, 'Dy') as name, 
        SUM(total) as total 
      FROM orders 
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'Dy'), DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;

    return NextResponse.json({
      revenue: revenueResult[0].total || 0,
      totalOrders: Number(ordersResult[0].count),
      activeProducts: Number(productsResult[0].count),
      lowStockItems,
      recentOrders,
      salesData: salesData.map(d => ({ name: d.name, total: Number(d.total) }))
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}