'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart, Maximize2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export interface QuickViewVariant {
  id: string;
  option_value_1?: string | null;
  color?: string | null;
  size?: string | null;
  sku?: string | null;
  price: number;
  sale_price: number;
  on_sale: boolean;
  stock: number;
  images: string[];
}

export interface QuickViewProduct {
  id: string;
  title: string;
  description: string;
  product_url: string;
  variants: QuickViewVariant[];
}

export function variantLabel(v: QuickViewVariant): string {
  return v.size || v.color || v.option_value_1 || v.sku || '';
}

export function choosableVariants(variants: QuickViewVariant[]): QuickViewVariant[] {
  return ([...new Map(variants.map(v => [variantLabel(v), v])).values()] as QuickViewVariant[]).filter(v => {
    const label = variantLabel(v);
    return label && label.toLowerCase() !== 'default';
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

export default function ProductQuickView({
  product,
  onClose,
}: {
  product: QuickViewProduct;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const firstInStock = product.variants.find(v => Number(v.stock) > 0) ?? product.variants[0];
  const [selectedVariant, setSelectedVariant] = useState<QuickViewVariant>(firstInStock);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const unique = choosableVariants(product.variants);

  const handleAdd = () => {
    addItem({
      id: selectedVariant.id,
      productId: product.id,
      productUrl: product.product_url,
      title: product.title,
      price: Number(selectedVariant.price),
      salePrice: Number(selectedVariant.sale_price),
      onSale: selectedVariant.on_sale,
      image: selectedVariant.images[0] ?? '',
      stock: Number(selectedVariant.stock),
      color: variantLabel(selectedVariant) || undefined,
    });
    setAdded(true);
    setTimeout(onClose, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <X size={14} />
        </button>

        {/* Expand */}
        <Link
          href={`/shop/p/${product.product_url}`}
          target="_blank"
          onClick={onClose}
          className="absolute top-3 left-3 z-10 w-7 h-7 bg-gray-100 hover:bg-orange-500 hover:text-white text-gray-600 rounded-full flex items-center justify-center transition-colors"
        >
          <Maximize2 size={12} />
        </Link>

        <div className="flex flex-col sm:flex-row">
          {/* Image — smaller on mobile */}
          <div className="relative w-full sm:w-2/5 aspect-square bg-gray-50 shrink-0 max-h-48 sm:max-h-none">
            <Image
              src={selectedVariant.images[0] ?? '/placeholder.jpg'}
              alt={product.title}
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col">
            <Link
              href={`/shop/p/${product.product_url}`}
              target="_blank"
              onClick={onClose}
              className="font-bold text-gray-900 mb-1 hover:text-orange-500 transition-colors block text-sm sm:text-lg"
            >
              {product.title}
            </Link>
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-3">{stripHtml(product.description)}</p>

            {/* Price */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl sm:text-2xl font-bold text-orange-500">
                £{Number(selectedVariant.on_sale ? selectedVariant.sale_price : selectedVariant.price).toFixed(2)}
              </span>
              {selectedVariant.on_sale && (
                <span className="text-sm text-gray-400 line-through">
                  £{Number(selectedVariant.price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Variants */}
            {unique.length >= 2 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Option</p>
                <div className="flex flex-wrap gap-1.5">
                  {unique.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={Number(v.stock) === 0}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        selectedVariant.id === v.id
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : Number(v.stock) === 0
                          ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                          : 'border-gray-200 text-gray-700 hover:border-orange-300'
                      }`}
                    >
                      {variantLabel(v)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {Number(selectedVariant.stock) === 0 && (
              <p className="text-xs text-red-500 mb-2">Out of stock</p>
            )}

            <button
              onClick={handleAdd}
              disabled={Number(selectedVariant.stock) === 0 || added}
              className="mt-auto w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <ShoppingCart size={16} />
              {added ? 'Added!' : 'Add to Basket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
