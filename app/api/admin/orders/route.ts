// app/api/admin/orders/route.ts

import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        customer_name,
        customer_email,
        items,
        total,
        fulfillment_status,
        created_at
      FROM public.orders
      ORDER BY created_at DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[ADMIN ORDERS GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
