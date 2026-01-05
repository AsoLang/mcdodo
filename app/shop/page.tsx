// app/shop/page.tsx

import ShopPage from '@/components/ShopPage';
import { neon } from '@neondatabase/serverless';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Shop - Mcdodo UK',
  description: 'Browse our collection of premium charging cables, chargers, and accessories',
  alternates: {
    canonical: 'https://mcdodo.co.uk/shop',
  },
};

const sql = neon(process.env.DATABASE_URL!);

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function queryProductsOrderByPosition() {
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
      p.position,
      json_build_object(
        'id', pv.id,
        'price', pv.price,
        'sale_price', pv.sale_price,
        'on_sale', pv.on_sale,
        'stock', pv.stock,
        'images', pv.images,
        'color', pv.color,
        'size', pv.size,
        'option_value_1', pv.option_value_1
      ) as variant
    FROM products p
    LEFT JOIN LATERAL (
      SELECT * FROM product_variants 
      WHERE product_id = p.id 
      ORDER BY
        (stock > 0) DESC,
        position ASC
      LIMIT 1
    ) pv ON true
    WHERE p.visible = true
    ORDER BY 
      p.position ASC NULLS LAST,
      p.created_at DESC
  `;
  return products;
}

async function queryProductsFallback() {
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
        'images', pv.images,
        'color', pv.color,
        'size', pv.size,
        'option_value_1', pv.option_value_1
      ) as variant
    FROM products p
    LEFT JOIN LATERAL (
      SELECT * FROM product_variants 
      WHERE product_id = p.id 
      ORDER BY
        (stock > 0) DESC,
        position ASC
      LIMIT 1
    ) pv ON true
    WHERE p.visible = true
    ORDER BY p.created_at DESC
  `;
  return products;
}

async function getProducts() {
  try {
    console.log('[Shop Page] Fetching products...');

    let products: any[] = [];

    try {
      products = await queryProductsOrderByPosition();
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      if (msg.toLowerCase().includes('position') && msg.toLowerCase().includes('does not exist')) {
        console.warn('[Shop Page] position column missing. Falling back to created_at order.');
        products = await queryProductsFallback();
      } else {
        throw err;
      }
    }

    console.log(`[Shop Page] Found ${products.length} products`);

    const productsWithUrls = products.map((p: any) => ({
      ...p,
      product_url: p.product_url || generateSlug(p.title),
    }));

    return productsWithUrls as any[];
  } catch (error) {
    console.error('[Shop Page] Error fetching products:', error);
    return [];
  }
}

export default async function Shop() {
  const products = await getProducts();
  console.log(`[Shop Page] Rendering with ${products.length} products`);
  return <ShopPage products={products} />;
}