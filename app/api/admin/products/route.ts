// Path: /app/api/admin/products/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const products = await sql`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', pv.id,
            'price', pv.price,
            'sale_price', pv.sale_price,
            'on_sale', pv.on_sale,
            'stock', pv.stock,
            'images', pv.images
          )
        ) as variants
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    const productsWithVariants = products.map(p => ({
      ...p,
      variant: p.variants?.[0] || null
    }));

    return NextResponse.json(productsWithVariants);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}