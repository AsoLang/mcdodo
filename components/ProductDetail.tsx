// Path: components/ProductDetail.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Minus, Plus, Star, ChevronDown, ChevronUp } from 'lucide-react';

interface ProductVariant {
  id: string;
  sku: string;
  option_value_1: string;
  color?: string | null;
  size?: string | null;
  price: number | string;
  sale_price: number | string;
  on_sale: boolean;
  stock: number | string;
  images: string[];
}

interface Accordion {
  id: string;
  title: string;
  content: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  categories: string;
  variants: ProductVariant[];
  accordions?: Accordion[];
  gallery_images?: string[];
  review_count?: number;
  review_rating?: number;
}

export default function ProductDetail({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [expandedAccordions, setExpandedAccordions] = useState<{ [key: string]: boolean }>({});

  const price = Number(selectedVariant.price);
  const salePrice = Number(selectedVariant.sale_price);
  const stock = Number(selectedVariant.stock);
  const onSale = selectedVariant.on_sale;

  const toggleAccordion = (id: string) => {
    setExpandedAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Get unique colors and sizes
  const uniqueColors = Array.from(new Set(
    product.variants.map(v => v.color).filter(Boolean)
  )) as string[];
  
  const uniqueSizes = Array.from(new Set(
    product.variants.map(v => v.size).filter(Boolean)
  )) as string[];

  const colorMap: { [key: string]: string } = {
    'White': '#FFFFFF',
    'Black': '#000000',
    'Blue': '#3B82F6',
    'Purple': '#A855F7',
    'Green': '#10B981',
    'Red': '#EF4444',
    'Orange': '#F97316',
    'Gray': '#6B7280',
    'Grey': '#6B7280',
    'Silver': '#C0C0C0',
    'Gold': '#FFD700'
  };

  const selectVariant = (color: string | null, size: string | null) => {
    const variant = product.variants.find(v => 
      (color === null || v.color === color) && 
      (size === null || v.size === size)
    );
    if (variant) {
      setSelectedVariant(variant);
      setSelectedImage(0);
      setQuantity(1);
    }
  };

  const handleAddToCart = () => {
    console.log('Add to cart:', { variant: selectedVariant, quantity });
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-orange-600">Shop</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            <motion.div 
              className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden"
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
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  SAVE £{(price - salePrice).toFixed(2)}
                </div>
              )}
            </motion.div>

            {selectedVariant.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {selectedVariant.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square bg-gray-50 rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === idx ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image src={image} alt={`View ${idx + 1}`} fill className="object-contain p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            {/* Reviews */}
            {product.review_count && product.review_count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < Math.floor(product.review_rating || 5) ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">{product.review_count} reviews</span>
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
            
            {/* Price */}
            <div className="flex items-baseline gap-4">
              {onSale ? (
                <>
                  <span className="text-4xl font-bold text-orange-500">
                    £{salePrice.toFixed(2)}
                  </span>
                  <span className="text-2xl text-gray-400 line-through">
                    £{price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-bold text-gray-900">
                  £{price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Size Selection - COMPETITOR STYLE */}
            {uniqueSizes.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Size: {selectedVariant.size || 'Select'}
                </label>
                <div className="flex gap-3">
                  {uniqueSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => selectVariant(selectedVariant.color || null, size)}
                      className={`min-w-[120px] px-6 py-3 border-2 rounded-lg font-semibold transition ${
                        selectedVariant.size === size
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-600'
                          : 'border-gray-300 text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection - COMPETITOR STYLE */}
            {uniqueColors.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Color: {selectedVariant.color || 'Select'}
                </label>
                <div className="flex gap-3">
                  {uniqueColors.map((color) => {
                    const bgColor = colorMap[color] || '#CCCCCC';
                    const isSelected = selectedVariant.color === color;
                    return (
                      <button
                        key={color}
                        onClick={() => selectVariant(color, selectedVariant.size || null)}
                        className={`relative w-12 h-12 rounded-full border-3 transition ${
                          isSelected ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: bgColor }}
                        title={color}
                      >
                        {color === 'White' && <div className="absolute inset-0 rounded-full border border-gray-300" />}
                        {isSelected && (
                          <div className="absolute -inset-1 rounded-full border-3 border-cyan-500"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity - COMPETITOR STYLE */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Quantity</label>
              <div className="flex items-center border-2 border-gray-300 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-50 text-gray-900 transition"
                >
                  <Minus size={18} />
                </button>
                <span className="px-8 py-3 font-semibold text-lg text-gray-900 border-x-2 border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="px-4 py-3 hover:bg-gray-50 text-gray-900 transition"
                  disabled={quantity >= stock}
                >
                  <Plus size={18} />
                </button>
              </div>
              {stock > 0 && stock <= 5 && (
                <p className="text-orange-600 font-medium mt-2">Only {stock} left in stock!</p>
              )}
              {stock === 0 && (
                <p className="text-red-600 font-medium mt-2">Out of Stock</p>
              )}
            </div>

            {/* Add to Cart Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={stock === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md"
              >
                <ShoppingCart size={22} />
                Add to Cart
              </button>
              <button 
                disabled={stock === 0}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                Buy Now
              </button>
            </div>

            {/* Description */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
              <div 
                className="text-gray-900 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        {product.gallery_images && product.gallery_images.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {product.gallery_images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
                  <Image src={img} alt={`Gallery ${idx + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accordions */}
        {product.accordions && product.accordions.length > 0 && (
          <div className="mt-16 max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
            <div className="space-y-4">
              {product.accordions.map((accordion) => (
                <div key={accordion.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleAccordion(accordion.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition"
                  >
                    <span className="font-bold text-gray-900 text-lg">{accordion.title}</span>
                    {expandedAccordions[accordion.id] ? (
                      <ChevronUp size={22} className="text-gray-600" />
                    ) : (
                      <ChevronDown size={22} className="text-gray-600" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedAccordions[accordion.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-white border-t border-gray-200">
                          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{accordion.content}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}