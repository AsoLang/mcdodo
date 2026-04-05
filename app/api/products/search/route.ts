// Path: app/api/products/search/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const SEARCH_CACHE_HEADER = 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800';
export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET() {
  try {
    const products = await sql`
      SELECT 
        p.id,
        p.title,
        COALESCE(
          p.product_url,
          TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM(p.title)), '[^a-z0-9]+', '-', 'g'))
        ) as product_url,
        COALESCE(p.categories, '') as categories,
        pv.price as price,
        pv.sale_price as sale_price,
        pv.on_sale,
        pv.images[1] as image
      FROM products p
      LEFT JOIN LATERAL (
        SELECT 
          price, 
          sale_price, 
          on_sale, 
          images
        FROM product_variants 
        WHERE product_id = p.id 
        ORDER BY position ASC
        LIMIT 1
      ) pv ON true
      WHERE p.visible = true
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json(
      products.map(p => ({
        id: p.id,
        title: p.title,
        product_url: p.product_url,
        categories: p.categories,
        price: Number(p.price || 0),
        sale_price: Number(p.sale_price || 0),
        on_sale: p.on_sale || false,
        image: p.image || ''
      })),
      {
        headers: {
          'Cache-Control': SEARCH_CACHE_HEADER,
        },
      }
    );
  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products', details: String(error) }, { status: 500 });
  }
}
