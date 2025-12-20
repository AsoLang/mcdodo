// Path: app/shop/page.tsx

import ShopPage from '@/components/ShopPage';
import { neon } from '@neondatabase/serverless';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const sql = neon(process.env.DATABASE_URL!);

// Generate URL slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function getProducts() {
  try {
    console.log('[Shop Page] Fetching products directly from database...');
    
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

    console.log(`[Shop Page] Found ${products.length} products`);
    
    // Generate URLs for products that don't have them
    const productsWithUrls = products.map(p => ({
      ...p,
      product_url: p.product_url || generateSlug(p.title)
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