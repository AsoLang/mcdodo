// Path: app/admin/products/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link'; // Added Link
import { CheckCircle, ExternalLink } from 'lucide-react'; // Added ExternalLink icon
import VariantEditor from './VariantEditor';
import ProductSections from './ProductSections';

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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${params.id}`);
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        router.push('/admin/products');
        return;
      }
      setProduct({
        ...data,
        accordions: data.accordions || [],
        product_images: data.product_images || [],
        gallery_images: data.gallery_images || [],
        review_count: data.review_count || 0,
        review_rating: data.review_rating || 5,
        related_products: data.related_products || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch product');
    }
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const error = await res.json();
        alert(`Error: ${error.details || 'Failed to update product'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-900 text-xl">Loading...</div>
    </div>
  );
  
  if (!product) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-900 text-xl">Product not found</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header with proper z-index */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 text-sm mt-1">{product.title}</p>
            </div>
            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle size={20} />
                  <span>Saved!</span>
                </div>
              )}
              
              {/* --- NEW VIEW AS BUTTON --- */}
              <Link 
                href={`/shop/p/${product.product_url}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition text-gray-900 font-medium"
              >
                <ExternalLink size={18} />
                View as
              </Link>
              {/* ------------------------- */}

              <button
                onClick={() => router.push('/admin/products')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-sm"
              >
                {saving ? 'Saving...' : 'Save Changes'}
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
                <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                <input
                  type="text"
                  value={product.title}
                  onChange={(e) => setProduct({ ...product, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Description (HTML)</label>
                <textarea
                  value={product.description}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Categories (comma-separated)</label>
                <input
                  type="text"
                  value={product.categories}
                  onChange={(e) => setProduct({ ...product, categories: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Product URL Slug</label>
                <input
                  type="text"
                  value={product.product_url}
                  onChange={(e) => setProduct({ ...product, product_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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