// Path: app/api/admin/dashboard/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '7d';

  try {
    let intervalSQL = "7 days";
    let truncInterval = "day";

    switch (range) {
      case '1d':  intervalSQL = '1 day';   truncInterval = 'hour'; break;
      case '14d': intervalSQL = '14 days'; truncInterval = 'day';  break;
      case '1m':  intervalSQL = '30 days'; truncInterval = 'day';  break;
      case '3m':  intervalSQL = '90 days'; truncInterval = 'week'; break;
      case '6m':  intervalSQL = '180 days'; truncInterval = 'month'; break;
      case '1y':  intervalSQL = '1 year';  truncInterval = 'month'; break;
      case 'all': intervalSQL = '100 years'; truncInterval = 'month'; break;
    }

    const totals = await sql`
      SELECT COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders 
      FROM orders 
      WHERE created_at >= NOW() - ${intervalSQL}::interval
      AND status IN ('paid', 'shipped', 'delivered', 'confirmed')
    `;

    const chartData = await sql`
      SELECT 
        date_trunc(${truncInterval}, created_at) as date,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(id) as orders
      FROM orders 
      WHERE created_at >= NOW() - ${intervalSQL}::interval
      AND status IN ('paid', 'shipped', 'delivered', 'confirmed')
      GROUP BY date
      ORDER BY date ASC
    `;

    // Visitor trend data
    const visitorData = await sql`
      SELECT 
        date,
        visitors,
        page_views
      FROM daily_stats 
      WHERE date >= CURRENT_DATE - ${intervalSQL}::interval
      ORDER BY date ASC
    `;

    const visitors = await sql`
      SELECT COALESCE(SUM(visitors), 0) as count 
      FROM daily_stats 
      WHERE date >= CURRENT_DATE - ${intervalSQL}::interval
    `;

    const customers = await sql`
      SELECT COUNT(*) as count 
      FROM customers
    `;

    const topProducts = await sql`
      WITH sales_data AS (
        SELECT item->>'id' as variant_id, SUM((item->>'quantity')::int) as sold_qty
        FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
        WHERE o.created_at >= NOW() - ${intervalSQL}::interval
        AND o.status IN ('paid', 'shipped', 'delivered', 'confirmed')
        GROUP BY variant_id
      )
      SELECT p.title, p.stock, COALESCE(SUM(sd.sold_qty), 0) as sold
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN sales_data sd ON sd.variant_id = pv.id::text
      GROUP BY p.id, p.title, p.stock
      ORDER BY sold DESC LIMIT 5
    `;

    let recentOrders: any[] = [];
    try {
      recentOrders = await sql`
        SELECT 
          id, 
          order_number, 
          customer_name, 
          customer_email,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_postal_code,
          shipping_country,
          status, 
          fulfillment_status,
          tracking_number,
          carrier,
          total, 
          items,
          created_at 
        FROM orders 
        ORDER BY created_at DESC 
        LIMIT 5
      ` as any[];
    } catch (err) {
      recentOrders = await sql`
        SELECT 
          id, 
          order_number, 
          customer_name, 
          customer_email,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_postal_code,
          shipping_country,
          status, 
          fulfillment_status,
          tracking_number,
          total, 
          items,
          created_at 
        FROM orders 
        ORDER BY created_at DESC 
        LIMIT 5
      ` as any[];
    }

    return NextResponse.json({
      revenue: totals[0].revenue,
      totalOrders: totals[0].orders,
      visitors: Number(visitors[0].count),
      totalCustomers: Number(customers[0].count),
      salesData: chartData.map((row: any) => ({
        name: new Date(row.date).toLocaleDateString('en-GB', {
          month: 'short', day: 'numeric', hour: truncInterval === 'hour' ? '2-digit' : undefined
        }),
        revenue: Number(row.revenue),
        orders: Number(row.orders)
      })),
      visitorData: visitorData.map((row: any) => ({
        name: new Date(row.date).toLocaleDateString('en-GB', {
          month: 'short', day: 'numeric'
        }),
        visitors: Number(row.visitors),
        pageViews: Number(row.page_views)
      })),
      topProducts,
      recentOrders
    }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });

  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
