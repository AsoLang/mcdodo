// Path: components/ProductDetail.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react';

interface ProductVariant {
  id: string;
  sku: string;
  option_value_1: string;
  price: number | string;
  sale_price: number | string;
  on_sale: boolean;
  stock: number | string;
  images: string[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  categories: string;
  variants: ProductVariant[];
}

export default function ProductDetail({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Convert string values to numbers
  const price = Number(selectedVariant.price);
  const salePrice = Number(selectedVariant.sale_price);
  const stock = Number(selectedVariant.stock);
  const onSale = selectedVariant.on_sale;

  const handleAddToCart = () => {
    console.log('Add to cart:', { variant: selectedVariant, quantity });
    // Add to cart logic here
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-orange-600">Shop</Link>
          <span>/</span>
          <span className="text-gray-900">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <motion.div 
              className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {selectedVariant.images[selectedImage] ? (
                <Image
                  src={selectedVariant.images[selectedImage]}
                  alt={product.title}
                  fill
                  className="object-contain p-8"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              {onSale && (
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                  SALE
                </div>
              )}
            </motion.div>

            {/* Thumbnail Gallery */}
            {selectedVariant.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {selectedVariant.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square bg-white rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === idx ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} ${idx + 1}`}
                      fill
                      className="object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.title}</h1>
              
              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                {onSale ? (
                  <>
                    <span className="text-4xl font-bold text-orange-500">
                      £{salePrice.toFixed(2)}
                    </span>
                    <span className="text-2xl text-gray-400 line-through">
                      £{price.toFixed(2)}
                    </span>
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
                      Save {Math.round(((price - salePrice) / price) * 100)}%
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-gray-900">
                    £{price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-6">
                {stock > 0 ? (
                  <>
                    <Check size={20} className="text-green-500" />
                    <span className="text-green-700 font-medium">
                      In Stock ({stock} available)
                    </span>
                  </>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Variant Selection */}
            {product.variants.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Variant
                </label>
                <div className="flex gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setSelectedImage(0);
                      }}
                      className={`px-6 py-3 rounded-lg border-2 font-medium transition ${
                        selectedVariant.id === variant.id
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {variant.option_value_1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-50"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="px-6 py-3 font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    className="p-3 hover:bg-gray-50"
                    disabled={quantity >= stock}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
            >
              <ShoppingCart size={24} />
              {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>

            {/* Description */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
              <div 
                className="text-gray-700 leading-relaxed prose max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Category:</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                {product.categories}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}