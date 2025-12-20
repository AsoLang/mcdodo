// Path: app/admin/products/[id]/ProductSections.tsx

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Trash2, Plus, Upload, X } from 'lucide-react';
import { Product } from './page';

interface Props {
  product: Product;
  setProduct: (product: Product) => void;
}

interface ProductOption {
  id: string;
  title: string;
  visible: boolean;
}

export default function ProductSections({ product, setProduct }: Props) {
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
  const [productFilter, setProductFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  useEffect(() => {
    fetchAvailableProducts();
  }, []);

  const fetchAvailableProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setAvailableProducts(data.map((p: any) => ({ 
        id: p.id, 
        title: p.title,
        visible: p.visible 
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addAccordion = () => {
    const newAccordion = {
      id: `accordion_${Date.now()}`,
      title: '',
      content: ''
    };
    setProduct({ ...product, accordions: [...product.accordions, newAccordion] });
  };

  const updateAccordion = (index: number, field: 'title' | 'content', value: string) => {
    const newAccordions = [...product.accordions];
    newAccordions[index][field] = value;
    setProduct({ ...product, accordions: newAccordions });
  };

  const deleteAccordion = (index: number) => {
    const newAccordions = [...product.accordions];
    newAccordions.splice(index, 1);
    setProduct({ ...product, accordions: newAccordions });
  };

  const uploadGalleryImage = async (file: File) => {
    const formData = new FormData();
    formData.append('images', file);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.urls && data.urls[0]) {
        setProduct({ ...product, gallery_images: [...product.gallery_images, data.urls[0]] });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = [...product.gallery_images];
    newImages.splice(index, 1);
    setProduct({ ...product, gallery_images: newImages });
  };

  const filteredProducts = availableProducts
    .filter(p => p.id !== product.id)
    .filter(p => {
      if (productFilter === 'visible') return p.visible;
      if (productFilter === 'hidden') return !p.visible;
      return true;
    });

  return (
    <>
      {/* Product Gallery */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Product Gallery</h2>
        <p className="text-sm text-gray-600 mb-4">Additional showcase images displayed below product details</p>
        <div className="flex gap-3 flex-wrap">
          {product.gallery_images.map((img, idx) => (
            <div key={idx} className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden group bg-gray-50">
              <Image src={img} alt="Gallery" fill className="object-cover" />
              <button
                onClick={() => removeGalleryImage(idx)}
                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadGalleryImage(file);
              }}
            />
            <Upload size={24} className="text-gray-400 mb-1" />
            <span className="text-xs text-gray-500">Upload</span>
          </label>
        </div>
      </div>

      {/* Accordions */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Product Details Accordions</h2>
          <button
            onClick={addAccordion}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
          >
            <Plus size={18} />
            Add Accordion
          </button>
        </div>
        <div className="space-y-4">
          {product.accordions.map((accordion, index) => (
            <div key={accordion.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-900">Accordion {index + 1}</h3>
                <button
                  onClick={() => deleteAccordion(index)}
                  className="text-red-600 hover:text-red-700 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                  <input
                    type="text"
                    value={accordion.title}
                    onChange={(e) => updateAccordion(index, 'title', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Specifications"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Content</label>
                  <textarea
                    value={accordion.content}
                    onChange={(e) => updateAccordion(index, 'content', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter accordion content..."
                  />
                </div>
              </div>
            </div>
          ))}
          {product.accordions.length === 0 && (
            <p className="text-gray-500 text-center py-8">No accordions added. Click "Add Accordion" to create one.</p>
          )}
        </div>
      </div>

      {/* Related Products */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Related Products (You May Also Like)</h2>
        <p className="text-sm text-gray-600 mb-4">Select up to 6 related products to show on the product page</p>
        
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setProductFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              productFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setProductFilter('visible')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              productFilter === 'visible'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Visible Only
          </button>
          <button
            onClick={() => setProductFilter('hidden')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              productFilter === 'hidden'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hidden Only
          </button>
        </div>

        <select
          multiple
          value={product.related_products}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            if (selected.length <= 6) {
              setProduct({ ...product, related_products: selected });
            } else {
              alert('Maximum 6 related products allowed');
            }
          }}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-64 bg-white"
        >
          {filteredProducts.map((p) => (
            <option 
              key={p.id} 
              value={p.id} 
              className="py-2 hover:bg-blue-50"
            >
              {p.title} {!p.visible && '(Hidden)'}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">💡 Hold Ctrl (Windows) or Cmd (Mac) to select multiple products</p>
        
        {/* Selected products preview */}
        {product.related_products.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Selected Products ({product.related_products.length}/6):
            </p>
            <div className="flex flex-wrap gap-2">
              {product.related_products.map(id => {
                const p = availableProducts.find(prod => prod.id === id);
                return p ? (
                  <span 
                    key={id} 
                    className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {p.title}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {product.related_products.length === 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">No related products selected</p>
          </div>
        )}
      </div>
    </>
  );
}