// Path: app/categories/page.tsx

import Link from 'next/link';
import Image from 'next/image';
import { neon } from '@neondatabase/serverless';
import CategoriesPageClient from '@/components/CategoriesPageClient';

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
    let products: any[] = [];

    try {
      products = await queryProductsOrderByPosition();
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      if (msg.toLowerCase().includes('position') && msg.toLowerCase().includes('does not exist')) {
        products = await queryProductsFallback();
      } else {
        throw err;
      }
    }

    const productsWithUrls = products.map((p: any) => ({
      ...p,
      product_url: p.product_url || generateSlug(p.title),
    }));

    return productsWithUrls as any[];
  } catch (error) {
    console.error('[Categories Page] Error fetching products:', error);
    return [];
  }
}

export default async function CategoriesPage() {
  const products = await getProducts();

  return <CategoriesPageClient products={products} />;
}