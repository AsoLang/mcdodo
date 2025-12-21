// Path: components/FeaturedProducts.tsx

import { neon } from '@neondatabase/serverless';
import Link from 'next/link';
import Image from 'next/image';

const sql = neon(process.env.DATABASE_URL!);

interface Product {
  id: string;
  title: string;
  product_url: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  image: string;
}

async function getFeaturedProducts() {
  try {
    const products = await sql`
      SELECT 
        p.id,
        p.title,
        p.product_url,
        pv.price,
        pv.sale_price,
        pv.on_sale,
        pv.images[1] as image
      FROM products p
      LEFT JOIN LATERAL (
        SELECT * FROM product_variants 
        WHERE product_id = p.id 
        ORDER BY position ASC
        LIMIT 1
      ) pv ON true
      WHERE p.visible = true AND p.featured = true
      ORDER BY p.created_at DESC
      LIMIT 8
    `;

    return products.map(p => ({
      ...p,
      product_url: p.product_url || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    })) as Product[];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our most popular charging solutions
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const price = Number(product.price || 0);
            const salePrice = Number(product.sale_price || 0);
            const onSale = product.on_sale || false;

            return (
              <Link
                key={product.id}
                href={`/shop/p/${product.product_url}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative aspect-square bg-gray-50">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain p-6 group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    {onSale && (
                      <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        SALE
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                      {product.title}
                    </h3>

                    <div className="flex items-baseline gap-2">
                      {onSale ? (
                        <>
                          <span className="text-xl font-bold text-orange-600">
                            £{salePrice.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            £{price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-gray-900">
                          £{price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/shop">
            <button className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-lg transition">
              View All Products
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}