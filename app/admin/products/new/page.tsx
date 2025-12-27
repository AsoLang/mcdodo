// Path: app/admin/products/new/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import VariantEditor from '../[id]/VariantEditor';
import ProductSections from '../[id]/ProductSections';

interface ProductVariant {
  id: string;
  sku: string;
  option_value_1: string;
  color: string;
  size: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  stock: number;
  images: string[];
}

interface Accordion {
  id: string;
  title: string;
  content: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  categories: string;
  visible: boolean;
  featured: boolean;
  product_url: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  variants: ProductVariant[];
  accordions: Accordion[];
  product_images: string[];
  gallery_images: string[];
  review_count: number;
  review_rating: number;
  related_products: string[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product>({
    id: 'new',
    title: '',
    description: '',
    categories: '',
    visible: true,
    featured: false,
    product_url: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    variants: [],
    accordions: [],
    product_images: [],
    gallery_images: [],
    review_count: 0,
    review_rating: 5,
    related_products: []
  });

  const handleCreate = async () => {
    if (!product.title || !product.product_url) {
      alert('Title and Product URL are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/products/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Product created successfully!');
        router.push(`/admin/products/${data.productId}`);
      } else {
        alert(`Error: ${data.error || 'Failed to create product'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
              <p className="text-gray-600 text-sm mt-1">Fill in the details below</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/products')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-sm"
              >
                {saving ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Title *</label>
                <input
                  type="text"
                  value={product.title}
                  onChange={(e) => setProduct({ ...product, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., USB-C to Lightning Cable"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Description (HTML)</label>
                <textarea
                  value={product.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Product description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Categories (comma-separated)</label>
                <input
                  type="text"
                  value={product.categories}
                  onChange={(e) => setProduct({ ...product, categories: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Cables, Charging"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Product URL Slug *</label>
                <input
                  type="text"
                  value={product.product_url}
                  onChange={(e) => setProduct({ ...product, product_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., usb-c-lightning-cable"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.visible}
                    onChange={(e) => setProduct({ ...product, visible: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Visible on Store</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.featured}
                    onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Featured Product</span>
                </label>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Review Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={product.review_rating}
                  onChange={(e) => setProduct({ ...product, review_rating: parseFloat(e.target.value) || 5 })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Review Count</label>
                <input
                  type="number"
                  min="0"
                  value={product.review_count}
                  onChange={(e) => setProduct({ ...product, review_count: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">SEO Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">SEO Title</label>
                <input
                  type="text"
                  value={product.seo_title || ''}
                  onChange={(e) => setProduct({ ...product, seo_title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave empty to use product title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">SEO Description</label>
                <textarea
                  value={product.seo_description || ''}
                  onChange={(e) => setProduct({ ...product, seo_description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Meta description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">SEO Keywords</label>
                <input
                  type="text"
                  value={product.seo_keywords || ''}
                  onChange={(e) => setProduct({ ...product, seo_keywords: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Comma-separated"
                />
              </div>
            </div>
          </div>

          {/* Variant Editor Component */}
          <VariantEditor product={product} setProduct={setProduct} />

          {/* Product Sections Component */}
          <ProductSections product={product} setProduct={setProduct} />
        </div>
      </div>
    </div>
  );
}