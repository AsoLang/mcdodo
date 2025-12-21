// app/api/admin/products/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure position column exists so admin list can order by it
    await sql`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 999999
    `;

    const rows = await sql`
      SELECT
        p.id,
        p.title,
        COALESCE(p.categories, '') AS categories,
        COALESCE(p.visible, true) AS visible,
        COALESCE(p.featured, false) AS featured,
        COALESCE(p.position, 999999)::int AS position,

        COALESCE(SUM(pv.stock), 0)::int AS total_stock,
        COUNT(pv.id)::int AS variant_count,
        COALESCE(BOOL_OR(pv.stock > 0), false) AS any_in_stock,
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
