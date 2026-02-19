// Path: components/ProductGrid.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  product_url: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  image: string;
  stock: number;
  review_count?: number;
  review_rating?: number;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const renderStars = (rating: number, size: number = 14) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={size} className="fill-cyan-500 text-cyan-500" />
        ))}
        {hasHalfStar && (
          <div className="relative" key="half">
            <Star size={size} className="text-cyan-500" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star size={size} className="fill-cyan-500 text-cyan-500" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={size} className="text-cyan-500" />
        ))}
      </>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/shop/p/${product.product_url}`}
          className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
        >
          {/* Product Image */}
          <div className="relative aspect-square bg-gray-50 overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.title}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
            
            {/* Sale Badge */}
            {product.on_sale && (
              <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                SALE
              </div>
            )}

            {/* Out of Stock Badge */}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2 mb-2 group-hover:text-orange-600 transition-colors min-h-[2.5rem]">
              {product.title}
            </h3>

            {/* Reviews */}
            {product.review_count && product.review_count > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <div className="flex">
                  {renderStars(product.review_rating || 0)}
                </div>
                <span className="text-xs text-cyan-600 ml-1">
                  ({product.review_count})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-2">
              {product.on_sale ? (
                <>
                  <span className="text-lg md:text-xl font-bold text-orange-500">
                    £{product.sale_price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    £{product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-lg md:text-xl font-bold text-gray-900">
                  £{product.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
