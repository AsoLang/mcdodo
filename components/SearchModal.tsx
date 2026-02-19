// Path: components/SearchModal.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SearchProduct {
  id: string;
  title: string;
  product_url: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  image: string;
  categories: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: SearchProduct[];
}

export default function SearchModal({ isOpen, onClose, products }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Filter products
  const filteredProducts = query.trim()
    ? products
        .filter(p => {
          const matchesTitle = p.title.toLowerCase().includes(query.toLowerCase());
          const matchesCategory = p.categories.toLowerCase().includes(query.toLowerCase());
          return matchesTitle || matchesCategory;
        })
        .slice(0, 8)
    : [];

  // Debug logging
  useEffect(() => {
    if (query) {
      console.log('[SearchModal] Query:', query);
      console.log('[SearchModal] Total products:', products.length);
      console.log('[SearchModal] Filtered results:', filteredProducts.length);
    }
  }, [query, products.length, filteredProducts.length]);

  // Popular searches (you can customize these)
  const popularSearches = ['USB-C Cable', 'Fast Charger', 'Lightning Cable', 'Power Bank'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 text-lg text-gray-900 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {query.trim() === '' ? (
                // Popular Searches
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={18} className="text-orange-500" />
                    <h3 className="font-semibold text-gray-900">Popular Searches</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(term)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : filteredProducts.length > 0 ? (
                // Search Results
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-4 px-2">
                    Found {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
                  </p>
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/shop/p/${product.product_url}`}
                        onClick={onClose}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition group"
                      >
                        {/* Product Image */}
                        <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.title}
                              fill
                              unoptimized
                              className="object-contain p-2"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 group-hover:text-orange-600 transition line-clamp-1">
                            {product.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {product.on_sale ? (
                              <>
                                <span className="font-bold text-orange-600">
                                  £{product.sale_price.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                  £{product.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-900">
                                £{product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="text-gray-400 group-hover:text-orange-600 transition">
                          →
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* View All Link */}
                  <Link
                    href={`/shop?search=${encodeURIComponent(query)}`}
                    onClick={onClose}
                    className="block mt-4 p-3 text-center text-orange-600 hover:text-orange-700 font-medium transition"
                  >
                    View all results →
                  </Link>
                </div>
              ) : (
                // No Results
                <div className="p-12 text-center">
                  <p className="text-gray-500 mb-2">No products found</p>
                  <p className="text-sm text-gray-400">Try different keywords</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
