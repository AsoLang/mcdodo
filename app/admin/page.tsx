// Path: app/admin/products/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react';

interface ProductVariant {
  id: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  stock: number;
  images: string[];
}

interface Product {
  id: string;
  title: string;
  product_url: string;
  visible: boolean;
  featured?: boolean;
  created_at: string;
  variant: ProductVariant;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      if (!res.ok) router.push('/admin');
    } catch (error) {
      router.push('/admin');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    }
  };

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;

      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          visible: !currentVisibility,
        }),
      });

      if (res.ok) {
        setProducts(products.map(p => 
          p.id === id ? { ...p, visible: !currentVisibility } : p
        ));
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition shadow-md"
          >
            <Plus size={20} />
            Add Product
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => {
                  const price = Number(product.variant?.price || 0);
                  const salePrice = Number(product.variant?.sale_price || 0);
                  const onSale = product.variant?.on_sale || false;
                  const mainImage = product.variant?.images?.[0];

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {mainImage ? (
                              <Image
                                src={mainImage}
                                alt={product.title}
                                width={64}
                                height={64}
                                className="object-contain w-full h-full p-2"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No Image
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                              {product.title}
                              {product.featured && (
                                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {product.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {onSale ? (
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-orange-600">
                              £{salePrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              £{price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            £{price.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          (product.variant?.stock || 0) > 10
                            ? 'bg-green-100 text-green-700'
                            : (product.variant?.stock || 0) > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {product.variant?.stock || 0} in stock
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleVisibility(product.id, product.visible)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition ${
                            product.visible
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {product.visible ? (
                            <>
                              <Eye size={14} />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff size={14} />
                              Hidden
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products found</p>
              <Link
                href="/admin/products/new"
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Add your first product
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}