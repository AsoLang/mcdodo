// Path: app/api/admin/products/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Auth check helper
async function isAuthenticated() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    return session?.value === 'authenticated';
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

export async function GET() {
  try {
    // Check authentication
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productsData = await sql`
      SELECT 
        p.id,
        p.title,
        p.categories,
        p.visible,
        p.featured,
        v.id as variant_id,
        v.price,
        v.sale_price,
        v.on_sale,
        v.stock,
        v.images
      FROM products p
      LEFT JOIN product_variants v ON p.id = v.product_id
      ORDER BY p.created_at DESC
    `;

    // Transform the data
    const products = productsData.map(row => ({
      id: row.id,
      title: row.title,
      categories: row.categories || '',
      visible: row.visible || false,
      featured: row.featured || false,
      variant: row.variant_id ? {
        id: row.variant_id,
        price: Number(row.price) || 0,
        sale_price: Number(row.sale_price) || 0,
        on_sale: row.on_sale || false,
        stock: Number(row.stock) || 0,
        images: row.images || []
      } : undefined
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch products', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}