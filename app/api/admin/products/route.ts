// Path: app/api/admin/products/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_auth'); 
  return session?.value === 'true';
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // Ensure columns exist
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 999999,
      ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0
    `;

    const rows = await sql`
      SELECT
        p.id,
        p.title,
        COALESCE(p.categories, '') AS categories,
        COALESCE(p.visible, true) AS visible,
        COALESCE(p.featured, false) AS featured,
        COALESCE(p.position, 999999)::int AS position,

        -- Use variant stock when variants exist, otherwise fall back to product stock
        CASE 
          WHEN COUNT(pv.id) > 0 THEN COALESCE(SUM(pv.stock), 0)
          ELSE COALESCE(p.stock, 0)
        END::int AS total_stock,
        
        COUNT(pv.id)::int AS variant_count,
        CASE 
          WHEN COUNT(pv.id) > 0 THEN COALESCE(BOOL_OR(pv.stock > 0), false)
          ELSE COALESCE(p.stock, 0) > 0
        END AS any_in_stock,
        COALESCE(BOOL_OR(pv.on_sale = true), false) AS any_on_sale,

        dv.id AS display_variant_id,
        dv.price AS display_price,
        dv.sale_price AS display_sale_price,
        dv.on_sale AS display_on_sale,
        dv.stock AS display_stock,
        dv.images AS display_images

      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT
          id,
          price,
          sale_price,
          on_sale,
          stock,
          images
        FROM product_variants
        WHERE product_id = p.id
        ORDER BY
          (stock > 0) DESC,
          position ASC NULLS LAST,
          id ASC
        LIMIT 1
      ) dv ON true
      GROUP BY
        p.id,
        p.title,
        p.categories,
        p.visible,
        p.featured,
        p.position,
        p.stock,
        dv.id,
        dv.price,
        dv.sale_price,
        dv.on_sale,
        dv.stock,
        dv.images
      ORDER BY
        p.position ASC NULLS LAST,
        p.created_at DESC NULLS LAST
    `;

    const products = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      categories: r.categories || '',
      visible: Boolean(r.visible),
      featured: Boolean(r.featured),
      position: Number(r.position || 999999),

      total_stock: Number(r.total_stock || 0),
      variant_count: Number(r.variant_count || 0),
      any_in_stock: Boolean(r.any_in_stock),
      any_on_sale: Boolean(r.any_on_sale),

      variant: r.display_variant_id
        ? {
            id: r.display_variant_id,
            price: r.display_price ? Number(r.display_price) : 0,
            sale_price: r.display_sale_price ? Number(r.display_sale_price) : 0,
            on_sale: Boolean(r.display_on_sale),
            stock: r.display_stock ? Number(r.display_stock) : 0,
            images: Array.isArray(r.display_images) ? r.display_images : [],
          }
        : null,
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id, stock, visible, price } = await req.json();

    // 1. Update the Main Product (Simple Stock)
    if (stock !== undefined || visible !== undefined) {
       await sql`
        UPDATE products 
        SET 
          stock = COALESCE(${stock}, stock),
          visible = COALESCE(${visible}, visible)
        WHERE id = ${id}
      `;
    }

    // 2. Optional: If you want to keep variant prices in sync, you can leave this alone
    // But importantly, we have now updated the main 'stock' column which the GET route reads.

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
