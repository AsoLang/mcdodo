// Path: app/admin/products/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';

interface ProductVariant {
  id: string;
  sku: string;
  option_value_1: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  stock: number;
  images: string[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  categories: string;
  visible: boolean;
  featured: boolean;
  product_url: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  variants: ProductVariant[];
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
    fetchProduct();
  }, []);

  useEffect(() => {
    if (product && originalProduct) {
      const changed = JSON.stringify(product) !== JSON.stringify(originalProduct);
      setHasChanges(changed);
    }
  }, [product, originalProduct]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      if (!res.ok) router.push('/admin');
    } catch (error) {
      router.push('/admin');
    }
  };

  const fetchProduct = async () => {
    try {
      console.log('Fetching product:', params.id);
      const res = await fetch(`/api/admin/products/${params.id}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Fetch error:', res.status, errorText);
        setError(`Failed to fetch product: ${res.status}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log('Product data received:', data);
      
      if (!data.variants || !Array.isArray(data.variants)) {
        console.error('Invalid product data - no variants array');
        setError('Invalid product data');
        setLoading(false);
        return;
      }

      setProduct(data);
      setOriginalProduct(JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setError('Network error fetching product');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product || !hasChanges) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (res.ok) {
        setMessage('✓ Product saved successfully!');
        setOriginalProduct(JSON.parse(JSON.stringify(product)));
        setHasChanges(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Failed to save product');
      }
    } catch (error) {
      setMessage('✗ Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (variantId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('images', file));

      const res = await fetch(`/api/admin/upload?variantId=${variantId}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const { urls } = await res.json();
        setProduct(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            variants: prev.variants.map(v =>
              v.id === variantId
                ? { ...v, images: [...(v.images || []), ...urls] }
                : v
            ),
          };
        });
        setMessage('✓ Images uploaded successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('✗ Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (variantId: string, imageUrl: string) => {
    setProduct(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: prev.variants.map(v =>
          v.id === variantId
            ? { ...v, images: (v.images || []).filter(img => img !== imageUrl) }
            : v
        ),
      };
    });
  };

  const updateVariant = (variantId: string, field: keyof ProductVariant, value: any) => {
    setProduct(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: prev.variants.map(v => {
          if (v.id === variantId) {
            // If turning off sale, reset sale price to regular price
            if (field === 'on_sale' && !value) {
              return { ...v, on_sale: false, sale_price: v.price };
            }
            return { ...v, [field]: value };
          }
          return v;
        }),
      };
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 font-semibold">{error || 'Product not found'}</div>
        <Link href="/admin/products" className="text-blue-600 hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <header className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/products" className="text-gray-600 hover:text-orange-600">
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              {hasChanges && (
                <span className="text-sm bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-medium">
                  Unsaved changes
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition ${
                hasChanges && !saving
                  ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
        >
          <div className={`rounded-lg shadow-sm px-4 py-3 border-l-4 ${
            message.includes('✓') 
              ? 'bg-green-50 border-green-500 text-green-700' 
              : 'bg-red-50 border-red-500 text-red-700'
          }`}>
            {message}
          </div>
        </motion.div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Product Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Product Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={product.title}
                    onChange={(e) => setProduct({ ...product, title: e.target.value })}
                    style={{ color: '#111827' }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    rows={4}
                    style={{ color: '#111827' }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Categories
                  </label>
                  <input
                    type="text"
                    value={product.categories}
                    onChange={(e) => setProduct({ ...product, categories: e.target.value })}
                    style={{ color: '#111827' }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.visible}
                      onChange={(e) => setProduct({ ...product, visible: e.target.checked })}
                      className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-semibold text-gray-900">Visible on Website</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.featured || false}
                      onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
                      className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-900">Featured (Best Seller)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">SEO Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    URL Slug
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={product.product_url}
                      onChange={(e) => setProduct({ ...product, product_url: e.target.value })}
                      placeholder="product-name-here"
                      style={{ color: '#111827' }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                    />
                    <button
                      onClick={() => setProduct({ ...product, product_url: generateSlug(product.title) })}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    URL: mcdodo.co.uk/shop/p/{product.product_url || 'slug'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={product.seo_title || ''}
                    onChange={(e) => setProduct({ ...product, seo_title: e.target.value })}
                    placeholder="Product Name | Mcdodo UK"
                    maxLength={60}
                    style={{ color: '#111827' }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {product.seo_title?.length || 0}/60 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    SEO Description
                  </label>
                  <textarea
                    value={product.seo_description || ''}
                    onChange={(e) => setProduct({ ...product, seo_description: e.target.value })}
                    placeholder="Brief description for search engines..."
                    rows={3}
                    maxLength={160}
                    style={{ color: '#111827' }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {product.seo_description?.length || 0}/160 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    SEO Keywords
                  </label>
                  <input
                    type="text"
                    value={product.seo_keywords || ''}
                    onChange={(e) => setProduct({ ...product, seo_keywords: e.target.value })}
                    placeholder="usb charger, fast charging, phone cable"
                    style={{ color: '#111827' }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Variants */}
          <div className="space-y-6">
            {product.variants && product.variants.length > 0 ? (
              product.variants.map((variant, index) => (
                <div key={variant.id} className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Variant {index + 1}: {variant.option_value_1}
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Price (£)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value))}
                          style={{ color: '#111827' }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Sale Price (£)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={variant.sale_price}
                          onChange={(e) => updateVariant(variant.id, 'sale_price', parseFloat(e.target.value))}
                          disabled={!variant.on_sale}
                          style={{ color: '#111827' }}
                          className={`w-full px-4 py-2 border rounded-lg outline-none ${
                            variant.on_sale
                              ? 'border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white'
                              : 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Stock
                        </label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value))}
                          style={{ color: '#111827' }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={variant.on_sale}
                            onChange={(e) => updateVariant(variant.id, 'on_sale', e.target.checked)}
                            className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm font-semibold text-gray-900">On Sale</span>
                        </label>
                      </div>
                    </div>

                    {/* Images */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Images
                      </label>
                      
                      {variant.images && variant.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {variant.images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                              <Image src={img} alt={`Image ${idx + 1}`} fill className="object-cover" />
                              <button
                                onClick={() => handleRemoveImage(variant.id, img)}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-orange-500 transition bg-gray-50">
                        <Upload size={20} className="text-gray-600" />
                        <span className="text-sm text-gray-700 font-medium">
                          {uploading ? 'Uploading...' : 'Upload Images'}
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageUpload(variant.id, e.target.files)}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-500">No variants found for this product</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}