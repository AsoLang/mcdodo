// Path: app/api/shop/products/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const PUBLIC_CACHE_HEADER = 'public, max-age=120, s-maxage=86400, stale-while-revalidate=604800';

export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET() {
  try {
    console.log('Fetching products from database...');
    
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
        ) as variant,
        (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id AND stock > 0 AND (
          (size IS NOT NULL AND size != '' AND LOWER(size) != 'default') OR
          (color IS NOT NULL AND color != '' AND LOWER(color) != 'default') OR
          (option_value_1 IS NOT NULL AND option_value_1 != '' AND LOWER(option_value_1) != 'default')
        )) as variant_count
      FROM products p
      LEFT JOIN LATERAL (
        SELECT * FROM product_variants
        WHERE product_id = p.id
        LIMIT 1
      ) pv ON true
      WHERE p.visible = true
      ORDER BY p.created_at DESC
    `;

    console.log(`Found ${products.length} products`);
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': PUBLIC_CACHE_HEADER,
      },
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
