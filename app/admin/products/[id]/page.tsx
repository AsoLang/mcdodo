'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Upload, X, Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Bold } from 'lucide-react';

interface ProductVariant {
  id: string;
  sku: string;
  option_value_1: string;
  color?: string;
  size?: string;
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
  accordions?: Accordion[];
  gallery_images?: string[];
  review_count?: number;
  review_rating?: number;
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
  const [expandedAccordions, setExpandedAccordions] = useState<{ [key: string]: boolean }>({});
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [draggedVariantIndex, setDraggedVariantIndex] = useState<number | null>(null);
  
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // New variant form
  const [showNewVariantForm, setShowNewVariantForm] = useState(false);
  const [newVariant, setNewVariant] = useState({
    color: '',
    size: '',
    sku: '',
    price: 0,
    sale_price: 0,
    stock: 0
  });

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
      const res = await fetch(`/api/admin/products/${params.id}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Fetch error:', res.status, errorText);
        setError(`Failed to fetch product: ${res.status}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      
      if (!data.variants || !Array.isArray(data.variants)) {
        console.error('Invalid product data - no variants array');
        setError('Invalid product data');
        setLoading(false);
        return;
      }

      // Initialize missing fields
      if (!data.accordions) data.accordions = [];
      if (!data.gallery_images) data.gallery_images = [];
      if (!data.review_count) data.review_count = 0;
      if (!data.review_rating) data.review_rating = 5;

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
        const errorData = await res.json();
        setMessage(`✗ Failed to save: ${errorData.details || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage('✗ Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (variantId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    console.log('Upload started, files:', files.length);
    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        console.log('Adding file:', file.name);
        formData.append('images', file);
      });

      console.log('Uploading to:', `/api/admin/upload?variantId=${variantId}`);
      const res = await fetch(`/api/admin/upload?variantId=${variantId}`, {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', res.status);

      if (res.ok) {
        const { urls } = await res.json();
        console.log('Upload successful, URLs:', urls);
        
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
      } else {
        const errorText = await res.text();
        console.error('Upload failed:', errorText);
        setMessage('✗ Failed to upload images');
      }
    } catch (error) {
      console.error('Upload error:', error);
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

  const handleImageDragStart = (variantId: string, index: number) => {
    setDraggedImageIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImageDrop = (variantId: string, dropIndex: number) => {
    if (draggedImageIndex === null) return;

    setProduct(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        variants: prev.variants.map(v => {
          if (v.id === variantId) {
            const newImages = [...(v.images || [])];
            const draggedImage = newImages[draggedImageIndex];
            newImages.splice(draggedImageIndex, 1);
            newImages.splice(dropIndex, 0, draggedImage);
            return { ...v, images: newImages };
          }
          return v;
        }),
      };
    });

    setDraggedImageIndex(null);
  };

  const updateVariant = (variantId: string, field: keyof ProductVariant, value: any) => {
    setProduct(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: prev.variants.map(v => {
          if (v.id === variantId) {
            if (field === 'on_sale' && !value) {
              return { ...v, on_sale: false, sale_price: v.price };
            }
            
            // Update option_value_1 when color or size changes
            const updatedVariant = { ...v, [field]: value };
            if (field === 'color' || field === 'size') {
              const color = field === 'color' ? value : v.color;
              const size = field === 'size' ? value : v.size;
              updatedVariant.option_value_1 = [color, size].filter(Boolean).join(' - ') || 'Default';
            }
            
            return updatedVariant;
          }
          return v;
        }),
      };
    });
  };

  const addNewVariant = () => {
    if (!product) return;
    
    if (!newVariant.color && !newVariant.size) {
      alert('Please fill in at least color or size');
      return;
    }

    const variantName = [newVariant.color, newVariant.size].filter(Boolean).join(' - ') || 'Default';

    const variant: ProductVariant = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sku: newVariant.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      option_value_1: variantName,
      color: newVariant.color || undefined,
      size: newVariant.size || undefined,
      price: newVariant.price,
      sale_price: newVariant.sale_price,
      on_sale: false,
      stock: newVariant.stock,
      images: []
    };

    setProduct(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: [...prev.variants, variant]
      };
    });

    setNewVariant({ color: '', size: '', sku: '', price: 0, sale_price: 0, stock: 0 });
    setShowNewVariantForm(false);
  };

  const deleteVariant = (variantId: string) => {
    if (!confirm('Delete this variant?')) return;
    
    setProduct(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: prev.variants.filter(v => v.id !== variantId)
      };
    });
  };

  // Accordion functions
  const addAccordion = () => {
    if (!product) return;
    
    const newAccordion: Accordion = {
      id: `accordion_${Date.now()}`,
      title: 'New Section',
      content: ''
    };

    setProduct(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        accordions: [...(prev.accordions || []), newAccordion]
      };
    });

    setExpandedAccordions(prev => ({ ...prev, [newAccordion.id]: true }));
  };

  const updateAccordion = (id: string, field: 'title' | 'content', value: string) => {
    setProduct(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        accordions: (prev.accordions || []).map(acc =>
          acc.id === id ? { ...acc, [field]: value } : acc
        )
      };
    });
  };

  const deleteAccordion = (id: string) => {
    if (!confirm('Delete this accordion section?')) return;
    
    setProduct(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        accordions: (prev.accordions || []).filter(acc => acc.id !== id)
      };
    });
  };

  const toggleAccordion = (id: string) => {
    setExpandedAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const makeBold = () => {
    if (!product || !descriptionRef.current) return;
    
    const textarea = descriptionRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = product.description.substring(start, end);
    
    if (selectedText) {
      const newDescription = 
        product.description.substring(0, start) +
        `<b>${selectedText}</b>` +
        product.description.substring(end);
      
      setProduct({ ...product, description: newDescription });
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 3, end + 3);
      }, 0);
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
          <Link href="/admin/products">
            <button className="text-orange-600 hover:text-orange-700 font-semibold">
              ← Back to Products
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-sm text-gray-600">{product.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {message && (
              <span className={`text-sm font-medium ${message.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Product Title</label>
                  <input
                    type="text"
                    value={product.title}
                    onChange={(e) => setProduct({ ...product, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-900">Description</label>
                    <button
                      onClick={makeBold}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                      title="Make selected text bold"
                    >
                      <Bold size={14} />
                      Bold
                    </button>
                  </div>
                  <textarea
                    ref={descriptionRef}
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Select text and click Bold to wrap in &lt;b&gt; tags</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Categories (comma-separated)</label>
                  <input
                    type="text"
                    value={product.categories}
                    onChange={(e) => setProduct({ ...product, categories: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                  />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.visible}
                      onChange={(e) => setProduct({ ...product, visible: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-semibold text-gray-900">Visible on Store</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.featured}
                      onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-semibold text-gray-900">Featured Product</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Product Details</h2>
                <button
                  onClick={addAccordion}
                  className="flex items-center gap-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  <Plus size={14} />
                  Add Section
                </button>
              </div>

              <div className="space-y-3">
                {product.accordions && product.accordions.length > 0 ? (
                  product.accordions.map((accordion) => (
                    <div key={accordion.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        onClick={() => toggleAccordion(accordion.id)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
                      >
                        <span className="font-semibold text-gray-900">{accordion.title || 'Untitled Section'}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAccordion(accordion.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 size={14} />
                          </button>
                          {expandedAccordions[accordion.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {expandedAccordions[accordion.id] && (
                        <div className="p-4 border-t border-gray-200 space-y-3 bg-gray-50">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Section Title
                            </label>
                            <input
                              type="text"
                              value={accordion.title}
                              onChange={(e) => updateAccordion(accordion.id, 'title', e.target.value)}
                              placeholder="e.g., About this product, Warranty"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Content
                            </label>
                            <textarea
                              value={accordion.content}
                              onChange={(e) => updateAccordion(accordion.id, 'content', e.target.value)}
                              rows={4}
                              placeholder="Enter content for this section..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No accordion sections yet. Add one to get started!</p>
                )}
              </div>
            </div>

            {/* Product Gallery Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Product Page Gallery</h2>
              <p className="text-sm text-gray-600 mb-4">Add additional images to display below the product description on the product page.</p>
              
              {product.gallery_images && product.gallery_images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {product.gallery_images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                      <Image src={img} alt={`Gallery ${idx + 1}`} fill className="object-cover" />
                      <button
                        onClick={() => {
                          setProduct(prev => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              gallery_images: (prev.gallery_images || []).filter((_, i) => i !== idx)
                            };
                          });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-6 cursor-pointer hover:border-orange-500 transition bg-gray-50">
                <Upload size={20} className="text-gray-600" />
                <span className="text-sm text-gray-700 font-medium">
                  {uploading ? 'Uploading...' : 'Upload Gallery Images'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    if (!e.target.files || e.target.files.length === 0) return;
                    setUploading(true);
                    try {
                      const formData = new FormData();
                      Array.from(e.target.files).forEach(file => formData.append('images', file));
                      const res = await fetch(`/api/admin/upload?type=gallery`, {
                        method: 'POST',
                        body: formData,
                      });
                      if (res.ok) {
                        const { urls } = await res.json();
                        setProduct(prev => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            gallery_images: [...(prev.gallery_images || []), ...urls]
                          };
                        });
                        setMessage('✓ Gallery images uploaded!');
                        setTimeout(() => setMessage(''), 3000);
                      }
                    } catch (error) {
                      setMessage('✗ Failed to upload images');
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">SEO Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">URL Slug</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={product.product_url}
                      onChange={(e) => setProduct({ ...product, product_url: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                    />
                    <button
                      onClick={() => setProduct({ ...product, product_url: generateSlug(product.title) })}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">SEO Title</label>
                  <input
                    type="text"
                    value={product.seo_title || ''}
                    onChange={(e) => setProduct({ ...product, seo_title: e.target.value })}
                    maxLength={60}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">SEO Description</label>
                  <textarea
                    value={product.seo_description || ''}
                    onChange={(e) => setProduct({ ...product, seo_description: e.target.value })}
                    rows={3}
                    maxLength={160}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Variants */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Product Variants</h2>
                <button
                  onClick={() => setShowNewVariantForm(!showNewVariantForm)}
                  className="flex items-center gap-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  <Plus size={14} />
                  Add Variant
                </button>
              </div>

              {/* New Variant Form */}
              {showNewVariantForm && (
                <div className="mb-4 p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                  <h3 className="font-bold text-gray-900 mb-3">New Variant</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Color (Optional)</label>
                        <input
                          type="text"
                          value={newVariant.color}
                          onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                          placeholder="e.g., Black, White"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Size (Optional)</label>
                        <input
                          type="text"
                          value={newVariant.size}
                          onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                          placeholder="e.g., 1m, 2m"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Price (£)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newVariant.price}
                          onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Sale Price (£)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newVariant.sale_price}
                          onChange={(e) => setNewVariant({ ...newVariant, sale_price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">SKU</label>
                        <input
                          type="text"
                          value={newVariant.sku}
                          onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                          placeholder="SKU-001"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Stock</label>
                        <input
                          type="number"
                          value={newVariant.stock}
                          onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={addNewVariant}
                        className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition"
                      >
                        Add Variant
                      </button>
                      <button
                        onClick={() => setShowNewVariantForm(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Variants */}
              <div className="space-y-4">
                {product.variants && product.variants.length > 0 ? (
                  product.variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      draggable
                      onDragStart={() => setDraggedVariantIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedVariantIndex === null) return;
                        
                        setProduct(prev => {
                          if (!prev) return prev;
                          const newVariants = [...prev.variants];
                          const draggedVariant = newVariants[draggedVariantIndex];
                          newVariants.splice(draggedVariantIndex, 1);
                          newVariants.splice(index, 0, draggedVariant);
                          return { ...prev, variants: newVariants };
                        });
                        
                        setDraggedVariantIndex(null);
                      }}
                      className={`border rounded-lg p-4 cursor-move transition ${
                        draggedVariantIndex === index 
                          ? 'border-orange-500 bg-orange-50 opacity-50' 
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <GripVertical size={18} className="text-gray-400" />
                          <h3 className="font-bold text-gray-900">
                            Variant {index + 1}: {variant.option_value_1}
                          </h3>
                          {index === 0 && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-semibold">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteVariant(variant.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Color and Size */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Color</label>
                            <input
                              type="text"
                              value={variant.color || ''}
                              onChange={(e) => updateVariant(variant.id, 'color', e.target.value)}
                              placeholder="e.g., Black"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Size</label>
                            <input
                              type="text"
                              value={variant.size || ''}
                              onChange={(e) => updateVariant(variant.id, 'size', e.target.value)}
                              placeholder="e.g., 1m"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Price (£)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.price}
                              onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Sale Price (£)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={variant.sale_price}
                              onChange={(e) => updateVariant(variant.id, 'sale_price', parseFloat(e.target.value))}
                              disabled={!variant.on_sale}
                              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none ${
                                variant.on_sale
                                  ? 'border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white text-gray-900'
                                  : 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-400'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Stock</label>
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={variant.on_sale}
                                onChange={(e) => updateVariant(variant.id, 'on_sale', e.target.checked)}
                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                              />
                              <span className="text-sm font-semibold text-gray-900">On Sale</span>
                            </label>
                          </div>
                        </div>

                        {/* Images with Drag & Drop */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Images <span className="text-gray-500 font-normal">(Drag to reorder • First = Main)</span>
                          </label>
                          {variant.images && variant.images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              {variant.images.map((img, idx) => (
                                <div
                                  key={idx}
                                  draggable
                                  onDragStart={() => handleImageDragStart(variant.id, idx)}
                                  onDragOver={handleImageDragOver}
                                  onDrop={() => handleImageDrop(variant.id, idx)}
                                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-move"
                                >
                                  <Image src={img} alt={`Image ${idx + 1}`} fill className="object-cover" />
                                  <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                    {idx === 0 ? 'MAIN' : idx + 1}
                                  </div>
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <GripVertical size={20} className="text-white" />
                                  </div>
                                  <button
                                    onClick={() => handleRemoveImage(variant.id, img)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-3 cursor-pointer hover:border-orange-500 transition bg-gray-50">
                            <Upload size={16} className="text-gray-600" />
                            <span className="text-xs text-gray-700 font-medium">
                              {uploading ? 'Uploading...' : 'Upload Images'}
                            </span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => {
                                console.log('File input change triggered');
                                handleImageUpload(variant.id, e.target.files);
                                e.target.value = ''; // Reset input
                              }}
                              disabled={uploading}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No variants yet. Add one to get started!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}