// app/api/admin/orders/route.ts

import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "all").toLowerCase();
    const date = (searchParams.get("date") || "all").toLowerCase();
    const sort = (searchParams.get("sort") || "newest").toLowerCase();

    const where: string[] = [];
    const values: any[] = [];

    if (search) {
      values.push(`%${search}%`);
      const idx = values.length;
      where.push(`(
        customer_email ILIKE $${idx} OR
        customer_name ILIKE $${idx} OR
        order_number::text ILIKE $${idx} OR
        id::text ILIKE $${idx}
      )`);
    }

    if (status !== "all") {
      values.push(status);
      const idx = values.length;
      where.push(`LOWER(COALESCE(fulfillment_status, 'unfulfilled')) = $${idx}`);
    }

    if (date !== "all") {
      let interval = "7 days";
      if (date === "today") interval = "0 days";
      if (date === "week") interval = "7 days";
      if (date === "month") interval = "1 month";
      values.push(interval);
      const idx = values.length;
      where.push(`created_at >= CURRENT_DATE - $${idx}::interval`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    let orderBy = "created_at DESC NULLS LAST";
    if (sort === "oldest") orderBy = "created_at ASC NULLS LAST";
    if (sort === "highest") orderBy = "total DESC NULLS LAST";
    if (sort === "lowest") orderBy = "total ASC NULLS LAST";

    const countQuery = `
      SELECT COUNT(*)::int AS count
      FROM public.orders
      ${whereSql}
    `;

    const dataQuery = `
      SELECT
        id,
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
        created_at,
        email,
        discount_code,
        discount_amount,
        weight_grams,
        service_type
      FROM public.orders
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const countRes = await pool.query(countQuery, values);
    const total = Number(countRes.rows[0]?.count || 0);

    const dataValues = [...values, limit, (page - 1) * limit];
    const { rows } = await pool.query(dataQuery, dataValues);

    const statsRes = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(total), 0)::numeric AS revenue,
        SUM(CASE WHEN LOWER(COALESCE(fulfillment_status, 'unfulfilled')) = 'unfulfilled' THEN 1 ELSE 0 END)::int AS unfulfilled,
        SUM(CASE WHEN LOWER(COALESCE(fulfillment_status, 'unfulfilled')) = 'shipped' THEN 1 ELSE 0 END)::int AS shipped,
        SUM(CASE WHEN LOWER(COALESCE(fulfillment_status, 'unfulfilled')) = 'delivered' THEN 1 ELSE 0 END)::int AS delivered
      FROM public.orders
    `);

    const data = rows.map((r: any) => ({
      id: String(r.id ?? r.order_number),
      order_number: r.order_number ?? null,
      stripe_session_id: r.stripe_session_id ?? null,
      customer_email: r.customer_email || r.email || null,
      customer_name: r.customer_name || "Guest",
      shipping_address_line1: r.shipping_address_line1 ?? null,
      shipping_address_line2: r.shipping_address_line2 ?? null,
      shipping_city: r.shipping_city ?? null,
      shipping_postal_code: r.shipping_postal_code ?? null,
      shipping_country: r.shipping_country ?? null,
      items: Array.isArray(r.items) ? r.items : (r.items ?? []),
      total: Number(r.total ?? 0),
      fulfillment_status: r.fulfillment_status ?? "unfulfilled",
      tracking_number: r.tracking_number ?? null,
      created_at: r.created_at ?? new Date().toISOString(),
      discount_code: r.discount_code ?? null,
      discount_amount: r.discount_amount ? Number(r.discount_amount) : null,
      weight_grams: r.weight_grams ?? null,
      service_type: r.service_type ?? 'small_parcel',
    }));

    return NextResponse.json({
      orders: data,
      total,
      stats: statsRes.rows[0] || {
        total: 0,
        revenue: 0,
        unfulfilled: 0,
        shipped: 0,
        delivered: 0,
      },
    });
  } catch (err) {
    console.error("[Admin Orders] Failed:", err);
    return NextResponse.json({ orders: [], total: 0, stats: null }, { status: 200 });
  }
}
