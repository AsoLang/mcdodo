// Path: app/shop/wireless-earphones/page.tsx

import { neon } from '@neondatabase/serverless';
import ProductGrid from '@/components/ProductGrid';
import Link from 'next/link';
import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = 300;

const sql = neon(process.env.DATABASE_URL!);

export const metadata: Metadata = {
  title: 'Wireless Earphones | Mcdodo UK - Premium Audio',
  description: 'Shop our collection of premium wireless earphones and earbuds with superior sound quality and battery life.',
  openGraph: {
    title: 'Wireless Earphones | Mcdodo UK',
    description: 'Premium wireless audio solutions',
  },
};

async function getWirelessEarphones() {
  try {
    const products = await sql`
      SELECT 
        p.id,
        p.title,
        p.product_url,
        p.categories,
        p.product_images,
        p.review_count,
        p.review_rating,
        v.price,
        v.sale_price,
        v.on_sale,
        v.images,
        v.stock
      FROM products p
      INNER JOIN LATERAL (
        SELECT * FROM product_variants 
        WHERE product_id = p.id 
        ORDER BY position ASC 
        LIMIT 1
      ) v ON true
      WHERE p.visible = true
      AND (
        p.categories ILIKE '%earphones%' 
        OR p.categories ILIKE '%earbuds%'
        OR p.categories ILIKE '%wireless%'
        OR p.categories ILIKE '%audio%'
        OR p.categories ILIKE '%headphones%'
      )
      ORDER BY p.created_at DESC
    `;

    return products.map((p: any) => {
      let image = '';
      if (p.product_images && p.product_images.length > 0) {
        image = p.product_images[0];
      } else if (p.images && p.images.length > 0) {
        image = p.images[0];
      }

      return {
        id: p.id,
        title: p.title,
        product_url: p.product_url,
        price: Number(p.price) || 0,
        sale_price: Number(p.sale_price) || 0,
        on_sale: p.on_sale || false,
        image: image,
        stock: Number(p.stock) || 0,
        review_count: p.review_count || 0,
        review_rating: Number(p.review_rating) || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching wireless earphones:', error);
    return [];
  }
}

export default async function WirelessEarphonesPage() {
  const products = await getWirelessEarphones();

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-orange-600">Shop</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Wireless Earphones</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Wireless Earphones
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Experience premium sound quality with our range of wireless earphones and earbuds featuring advanced audio technology and long battery life.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <h3 className="font-bold text-gray-900 mb-2">Premium Sound</h3>
            <p className="text-sm text-gray-700">Crystal clear audio with deep bass and balanced highs</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-2">Long Battery Life</h3>
            <p className="text-sm text-gray-700">Extended playtime with fast charging support</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <h3 className="font-bold text-gray-900 mb-2">Comfort Fit</h3>
            <p className="text-sm text-gray-700">Ergonomic design for all-day comfort</p>
          </div>
        </div>

        {/* Products */}
        {products.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            </div>
            <ProductGrid products={products} />
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No products found</h2>
            <p className="text-gray-600 mb-6">Check back soon for new wireless earphones!</p>
            <Link 
              href="/shop"
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Browse All Products
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
