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

    const dataQueryWithCarrier = `
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
        carrier,
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
    const dataQueryWithoutCarrier = `
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
    let rows: any[] = [];
    try {
      const res = await pool.query(dataQueryWithCarrier, dataValues);
      rows = res.rows || [];
    } catch (err) {
      const res = await pool.query(dataQueryWithoutCarrier, dataValues);
      rows = res.rows || [];
    }

    const variantIds = new Set<string>();
    const skus = new Set<string>();

    rows.forEach((r: any) => {
      const items = Array.isArray(r.items) ? r.items : (r.items ?? []);
      items.forEach((item: any) => {
        if (item?.variant_id) variantIds.add(String(item.variant_id));
        if (item?.sku) skus.add(String(item.sku));
      });
    });

    const productUrlByVariant = new Map<string, string>();
    const productUrlBySku = new Map<string, string>();

    if (variantIds.size > 0 || skus.size > 0) {
      const lookup = await pool.query(`
        SELECT pv.id::text AS variant_id, pv.sku, p.product_url
        FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE pv.id::text = ANY($1::text[])
           OR pv.sku = ANY($2::text[])
      `, [Array.from(variantIds), Array.from(skus)]);

      lookup.rows.forEach((row: any) => {
        if (row.variant_id && row.product_url) {
          productUrlByVariant.set(String(row.variant_id), row.product_url);
        }
        if (row.sku && row.product_url) {
          productUrlBySku.set(String(row.sku), row.product_url);
        }
      });
    }

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
      items: (Array.isArray(r.items) ? r.items : (r.items ?? [])).map((item: any) => {
        const existingUrl = item?.product_url || item?.productUrl || null;
        const viaVariant = item?.variant_id ? productUrlByVariant.get(String(item.variant_id)) : null;
        const viaSku = item?.sku ? productUrlBySku.get(String(item.sku)) : null;
        const productUrl = existingUrl || viaVariant || viaSku;
        return productUrl ? { ...item, product_url: productUrl } : item;
      }),
      total: Number(r.total ?? 0),
      fulfillment_status: r.fulfillment_status ?? "unfulfilled",
      tracking_number: r.tracking_number ?? null,
      carrier: r.carrier ?? null,
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
