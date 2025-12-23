// app/api/admin/orders/route.ts

import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT
        order_number,
        stripe_session_id,
        customer_email,
        customer_name,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        items,
        total,
        fulfillment_status,
        tracking_number,
        created_at
      FROM public.orders
      ORDER BY created_at DESC
      LIMIT 5000
    `);

    const data = rows.map((r: any) => ({
      id: String(r.order_number ?? r.stripe_session_id), // admin UI expects `id`
      order_number: r.order_number ?? null,
      stripe_session_id: r.stripe_session_id ?? null,
      customer_email: r.customer_email ?? "",
      customer_name: r.customer_name ?? "",
      shipping_address_line1: r.shipping_address_line1 ?? null,
      shipping_address_line2: r.shipping_address_line2 ?? null,
      shipping_city: r.shipping_city ?? "",
      shipping_postal_code: r.shipping_postal_code ?? null,
      shipping_country: r.shipping_country ?? null,
      items: Array.isArray(r.items) ? r.items : (r.items ?? []),
      total: Number(r.total ?? 0),
      fulfillment_status: r.fulfillment_status ?? "unfulfilled",
      tracking_number: r.tracking_number ?? null,
      created_at: r.created_at ?? new Date().toISOString(),
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error("[Admin Orders] Failed:", err);
    return NextResponse.json([], { status: 200 });
  }
}