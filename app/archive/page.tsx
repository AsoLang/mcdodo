// Path: app/archive/page.tsx

import Link from 'next/link';
import Image from 'next/image';
import { neon } from '@neondatabase/serverless';
import { ArrowLeft, ArchiveX } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = 300;

// Database connection
const sql = neon(process.env.DATABASE_URL!);

export const metadata: Metadata = {
  title: 'Product Archive | Mcdodo UK',
  description: 'View discontinued and archived products from Mcdodo UK.',
  robots: 'noindex, follow', // Good practice not to index archive pages to focus SEO on active products
};

interface ArchivedProduct {
  id: string;
  title: string;
  product_url: string;
  image: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
}

async function getArchivedProducts(): Promise<ArchivedProduct[]> {
  try {
    // Fetch products where visible = false
    // We join with the first variant to get a price and fallback image
    const data = await sql`
      SELECT 
        p.id, 
        p.title, 
        p.product_url,
        p.product_images,
        v.price,
        v.sale_price,
        v.on_sale,
        v.images as variant_images
      FROM products p
      LEFT JOIN LATERAL (
        SELECT price, sale_price, on_sale, images 
        FROM product_variants 
        WHERE product_id = p.id 
        ORDER BY position ASC 
        LIMIT 1
      ) v ON true
      WHERE p.visible = false
      ORDER BY p.id DESC
    `;

    return data.map((item: any) => {
      // Prioritize product_images, then variant images, then placeholder
      let image = '/placeholder.jpg';
      if (item.product_images && item.product_images.length > 0) {
        image = item.product_images[0];
      } else if (item.variant_images && item.variant_images.length > 0) {
        image = item.variant_images[0];
      }

      return {
        id: item.id,
        title: item.title,
        product_url: item.product_url,
        image: image,
        price: Number(item.price) || 0,
        sale_price: Number(item.sale_price) || 0,
        on_sale: item.on_sale || false,
      };
    });
  } catch (error) {
    console.error('Error fetching archived products:', error);
    return [];
  }
}

export default async function ArchivePage() {
  const products = await getArchivedProducts();

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-4 font-sans text-black">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 text-center md:text-left border-b border-gray-100 pb-8">
          <Link 
            href="/shop" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition mb-4"
          >
            <ArrowLeft size={16} />
            Back to Active Shop
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-black tracking-tight mb-4">
            Product <span className="text-gray-400">Archive</span>
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            These products are no longer listed in our main store but can still be viewed for reference.
          </p>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product) => (
              <Link 
                key={product.id} 
                href={`/shop/p/${product.product_url}`}
                className="group block"
              >
                <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-4 border border-gray-100 group-hover:border-gray-300 transition">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-6 group-hover:scale-105 transition duration-300 opacity-75 grayscale group-hover:grayscale-0 group-hover:opacity-100"
                  />
                  <div className="absolute top-3 right-3 bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                    ARCHIVED
                  </div>
                </div>
                
                <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition mb-1 line-clamp-2">
                  {product.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm">
                  {product.on_sale ? (
                    <>
                      <span className="font-bold text-gray-400 line-through">
                        £{product.price.toFixed(2)}
                      </span>
                      <span className="font-bold text-gray-900">
                        £{product.sale_price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-gray-900">
                      £{product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <ArchiveX size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Archive is Empty</h3>
            <p className="text-gray-500">There are no hidden or archived products at the moment.</p>
            <Link href="/shop" className="mt-6 inline-block px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition">
              Browse Active Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
