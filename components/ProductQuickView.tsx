'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart, Loader2, Maximize2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface Variant {
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

function variantLabel(v: Variant): string {
  return v.size || v.color || v.option_value_1 || v.sku || '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

interface QuickViewProduct {
  id: string;
  title: string;
  description: string;
  product_url: string;
  variants: Variant[];
}

export default function ProductQuickView({
  productUrl,
  onClose,
}: {
  productUrl: string;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const [product, setProduct] = useState<QuickViewProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productUrl}`)
      .then(r => r.json())
      .then(data => {
        setProduct(data);
        setSelectedVariant(
          data.variants.find((v: Variant) => Number(v.stock) > 0) ?? data.variants[0]
        );
        setLoading(false);
      });
  }, [productUrl]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleAdd = () => {
    if (!product || !selectedVariant) return;
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
      color: selectedVariant.option_value_1 ?? undefined,
    });
    setAdded(true);
    setTimeout(onClose, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        {/* Expand to full product page */}
        <Link
          href={`/shop/p/${productUrl}`}
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-8 h-8 bg-gray-100 hover:bg-orange-500 hover:text-white text-gray-600 rounded-full flex items-center justify-center transition-colors"
          title="View full product"
        >
          <Maximize2 size={14} />
        </Link>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-orange-500" />
          </div>
        ) : product && selectedVariant ? (
          <div className="flex flex-col sm:flex-row">
            {/* Image */}
            <div className="relative sm:w-1/2 aspect-square bg-gray-50 shrink-0">
              <Image
                src={selectedVariant.images[0] ?? '/placeholder.jpg'}
                alt={product.title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            {/* Details */}
            <div className="sm:w-1/2 p-6 flex flex-col">
              <Link href={`/shop/p/${product.product_url}`} target="_blank" onClick={onClose} className="text-lg font-bold text-gray-900 mb-2 hover:text-orange-500 transition-colors block no-underline">{product.title}</Link>
              <p className="text-sm text-gray-500 line-clamp-3 mb-4">{stripHtml(product.description)}</p>

              {/* Price */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-orange-500">
                  £{Number(selectedVariant.on_sale ? selectedVariant.sale_price : selectedVariant.price).toFixed(2)}
                </span>
                {selectedVariant.on_sale && (
                  <span className="text-base text-gray-400 line-through">
                    £{Number(selectedVariant.price).toFixed(2)}
                  </span>
                )}
              </div>

              {/* Variants */}
              {(() => {
                const unique = [...new Map(product.variants.map(v => [variantLabel(v), v])).values()].filter(v => {
                  const label = variantLabel(v);
                  return label && label.toLowerCase() !== 'default';
                });
                if (unique.length < 2) return null;
                return (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Option</p>
                    <div className="flex flex-wrap gap-2">
                      {unique.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          disabled={Number(v.stock) === 0}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
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
                );
              })()}

              {Number(selectedVariant.stock) === 0 && (
                <p className="text-sm text-red-500 mb-3">Out of stock</p>
              )}

              <button
                onClick={handleAdd}
                disabled={Number(selectedVariant.stock) === 0 || added}
                className="mt-auto w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                {added ? 'Added!' : 'Add to Basket'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
