// Path: app/admin/products/[id]/VariantEditor.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, Plus, GripVertical, Upload, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Product } from './page';

interface Props {
  product: Product;
  setProduct: (product: Product) => void;
}

export default function VariantEditor({ product, setProduct }: Props) {
  const addVariant = () => {
    const newVariant = {
      id: `temp_${Date.now()}`,
      sku: `SKU-${Date.now()}`,
      option_value_1: 'Default',
      color: '',
      size: '',
      price: 0,
      sale_price: 0,
      on_sale: false,
      stock: 0,
      images: []
    };
    setProduct({ ...product, variants: [...product.variants, newVariant] });
  };

  const deleteVariant = (index: number) => {
    const newVariants = [...product.variants];
    newVariants.splice(index, 1);
    setProduct({ ...product, variants: newVariants });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...product.variants];
    (newVariants[index] as any)[field] = value;
    setProduct({ ...product, variants: newVariants });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(product.variants);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setProduct({ ...product, variants: items });
  };

  const uploadImages = async (files: FileList, variantIndex: number) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.urls) {
        const newVariants = [...product.variants];
        newVariants[variantIndex].images = [...newVariants[variantIndex].images, ...data.urls];
        setProduct({ ...product, variants: newVariants });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images');
    }
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    const newVariants = [...product.variants];
    newVariants[variantIndex].images.splice(imageIndex, 1);
    setProduct({ ...product, variants: newVariants });
  };

  const reorderVariantImages = (variantIndex: number, result: any) => {
    if (!result.destination) return;
    const newVariants = [...product.variants];
    const images = Array.from(newVariants[variantIndex].images);
    const [reorderedImage] = images.splice(result.source.index, 1);
    images.splice(result.destination.index, 0, reorderedImage);
    newVariants[variantIndex].images = images;
    setProduct({ ...product, variants: newVariants });
  };

  const uploadProductImages = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.urls) {
        setProduct({ ...product, product_images: [...product.product_images, ...data.urls] });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images');
    }
  };

  const removeProductImage = (index: number) => {
    const newImages = [...product.product_images];
    newImages.splice(index, 1);
    setProduct({ ...product, product_images: newImages });
  };

  const reorderProductImages = (result: any) => {
    if (!result.destination) return;
    const images = Array.from(product.product_images);
    const [reorderedImage] = images.splice(result.source.index, 1);
    images.splice(result.destination.index, 0, reorderedImage);
    setProduct({ ...product, product_images: images });
  };

  return (
    <>
      {/* Product Images */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Product Images (Default)</h2>
        <p className="text-sm text-gray-600 mb-4">These images show by default. When user selects a variant with images, variant images replace these.</p>
        <DragDropContext onDragEnd={reorderProductImages}>
          <Droppable droppableId="product-images" direction="horizontal">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="flex gap-3 flex-wrap"
              >
                {product.product_images.map((img, idx) => (
                  <Draggable key={`product-img-${idx}`} draggableId={`product-img-${idx}`} index={idx}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden group bg-gray-50"
                      >
                        <Image src={img} alt="Product" fill className="object-cover" />
                        {idx === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                            MAIN
                          </div>
                        )}
                        <button
                          onClick={() => removeProductImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) uploadProductImages(files);
                    }}
                  />
                  <Upload size={24} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload</span>
                </label>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Product Variants */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Product Variants</h2>
          <button
            onClick={addVariant}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition shadow-sm font-medium"
          >
            <Plus size={18} />
            Add Variant
          </button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="variants">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {product.variants.map((variant, index) => (
                  <Draggable key={variant.id} draggableId={variant.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start gap-4">
                          <div {...provided.dragHandleProps} className="mt-2 cursor-move">
                            <GripVertical size={20} className="text-gray-400" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="font-semibold text-gray-900">
                                Variant {index + 1}
                                {index === 0 && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">DEFAULT</span>}
                              </h3>
                              <button
                                onClick={() => deleteVariant(index)}
                                className="text-red-600 hover:text-red-700 transition"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Color</label>
                                <input
                                  type="text"
                                  placeholder="e.g., Black"
                                  value={variant.color || ''}
                                  onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Size</label>
                                <input
                                  type="text"
                                  placeholder="e.g., 1m"
                                  value={variant.size || ''}
                                  onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Price (£)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Sale Price (£)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.sale_price}
                                  onChange={(e) => updateVariant(index, 'sale_price', parseFloat(e.target.value) || 0)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Stock</label>
                                <input
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={variant.on_sale}
                                    onChange={(e) => updateVariant(index, 'on_sale', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-gray-900">On Sale</span>
                                </label>
                              </div>
                            </div>

                            {/* Variant Images */}
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-2">Variant Images (Optional - replaces product images)</label>
                              <DragDropContext onDragEnd={(result) => reorderVariantImages(index, result)}>
                                <Droppable droppableId={`variant-images-${index}`} direction="horizontal">
                                  {(provided) => (
                                    <div 
                                      {...provided.droppableProps} 
                                      ref={provided.innerRef}
                                      className="flex gap-3 flex-wrap"
                                    >
                                      {variant.images.map((img, imgIdx) => (
                                        <Draggable key={`${variant.id}-img-${imgIdx}`} draggableId={`${variant.id}-img-${imgIdx}`} index={imgIdx}>
                                          {(provided) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className="relative w-24 h-24 border border-gray-300 rounded-lg overflow-hidden group bg-white"
                                            >
                                              <Image src={img} alt="Variant" fill className="object-cover" />
                                              {imgIdx === 0 && (
                                                <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded">
                                                  MAIN
                                                </div>
                                              )}
                                              <button
                                                onClick={() => removeVariantImage(index, imgIdx)}
                                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                                              >
                                                <X size={14} />
                                              </button>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                      <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          multiple
                                          className="hidden"
                                          onChange={(e) => {
                                            const files = e.target.files;
                                            if (files && files.length > 0) uploadImages(files, index);
                                          }}
                                        />
                                        <Upload size={20} className="text-gray-400" />
                                      </label>
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </>
  );
}