// Path: app/api/products/search/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Generate URL slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    console.log('[Search API] Fetching products for search...');
    
    const products = await sql`
      SELECT 
        p.id,
        p.title,
        p.product_url,
        p.categories,
        pv.price::numeric as price,
        pv.sale_price::numeric as sale_price,
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

    console.log(`[Search API] Found ${products.length} products`);
    
    // Transform to ensure consistent types and generate missing URLs
    const formattedProducts = products.map(p => ({
      id: p.id,
      title: p.title,
      product_url: p.product_url || generateSlug(p.title),
      categories: p.categories || '',
      price: Number(p.price || 0),
      sale_price: Number(p.sale_price || 0),
      on_sale: p.on_sale || false,
      image: p.image || ''
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products', details: String(error) }, { status: 500 });
  }
}