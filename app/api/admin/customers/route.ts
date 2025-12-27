// Path: app/api/admin/customers/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // We select from 'customers' (The master list)
    // And JOIN 'orders' to calculate totals dynamically
    const customers = await sql`
      SELECT 
        c.email,
        c.billing_name as name,
        c.billing_phone as phone,
        c.billing_city as city,
        c.billing_country as country,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_spent,
        MAX(o.created_at) as last_order
      FROM customers c
      LEFT JOIN orders o ON o.customer_email = c.email
      GROUP BY c.email, c.billing_name, c.billing_phone, c.billing_city, c.billing_country
      ORDER BY total_spent DESC
    `;

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Customers API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}