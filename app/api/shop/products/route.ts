// Path: app/api/shop/products/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const products = await sql`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.categories,
        p.product_url,
        p.visible,
        p.featured,
        p.created_at,
        json_build_object(
          'id', pv.id,
          'price', pv.price,
          'sale_price', pv.sale_price,
          'on_sale', pv.on_sale,
          'stock', pv.stock,
          'images', pv.images
        ) as variant
      FROM products p
      LEFT JOIN LATERAL (
        SELECT * FROM product_variants 
        WHERE product_id = p.id 
        LIMIT 1
      ) pv ON true
      WHERE p.visible = true
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}