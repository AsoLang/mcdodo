// Path: /components/ProductCard.tsx

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ProductCardProps {
  product_url: string;
  title: string;
  price: number;
  salePrice: number;
  onSale: boolean;
  image: string;
  index: number;
}

export default function ProductCard({ product_url, title, price, salePrice, onSale, image, index }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/shop/p/${product_url}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.4 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative cursor-pointer h-full"
      >
        <motion.div 
          className="relative overflow-hidden rounded-2xl bg-white shadow-lg h-full flex flex-col"
          animate={{ 
            y: isHovered ? -8 : 0,
            boxShadow: isHovered 
              ? "0 20px 40px rgba(0,0,0,0.15)" 
              : "0 4px 20px rgba(0,0,0,0.08)"
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Sale badge */}
          {onSale && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: index * 0.03 + 0.2, duration: 0.3 }}
              className="absolute top-4 right-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg"
            >
              SALE
            </motion.div>
          )}
          
          {/* Image container */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            <motion.div
              animate={{ scale: isHovered ? 1.08 : 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-full"
            >
              <Image 
                src={image || '/placeholder.jpg'} 
                alt={title} 
                fill 
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
              />
            </motion.div>
          </div>
          
          {/* Product info */}
          <div className="p-4 md:p-6 bg-white flex-1 flex flex-col">
            <h3 className="font-semibold text-base md:text-lg mb-2 md:mb-3 line-clamp-2 text-gray-900 min-h-[2.5rem] md:min-h-[3.5rem]">
              {title}
            </h3>
            
            <div className="flex items-center gap-2 md:gap-3 mt-auto mb-2 md:mb-3 flex-wrap">
              {onSale ? (
                <>
                  <span className="text-xl md:text-2xl font-bold text-orange-500">
                    £{salePrice.toFixed(2)}
                  </span>
                  <span className="text-base md:text-lg text-gray-400 line-through">
                    £{price.toFixed(2)}
                  </span>
                  <span className="ml-auto text-xs md:text-sm font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded">
                    {Math.round(((price - salePrice) / price) * 100)}% OFF
                  </span>
                </>
              ) : (
                <span className="text-xl md:text-2xl font-bold text-gray-900">
                  £{price.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Hover button */}
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ 
                opacity: isHovered ? 1 : 0,
                height: isHovered ? 'auto' : 0
              }}
              transition={{ duration: 0.2 }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 md:py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md text-sm md:text-base"
            >
              View Details
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </Link>
  );
}