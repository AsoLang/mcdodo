// Path: components/AdminProductsClient.tsx

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  LogOut,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Filter
} from 'lucide-react';

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
  description: string;
  categories: string;
  product_url: string;
  visible: boolean;
  featured?: boolean;
  created_at: string;
  variant: ProductVariant;
}

type FilterType = 'all' | 'visible' | 'hidden';

export default function AdminProductsClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('visible'); // Default to visible
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      alert('Error deleting product');
    } finally {
      setDeleting(null);
    }
  };

  // Filter products based on search and visibility filter
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply visibility filter
    if (filterType === 'visible') {
      filtered = filtered.filter(p => p.visible);
    } else if (filterType === 'hidden') {
      filtered = filtered.filter(p => !p.visible);
    }

    // Apply search filter
    if (search) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.categories.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [products, search, filterType]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-orange-600">Admin Panel</h2>
        </div>
        
        <nav className="px-4 space-y-2">
          <Link 
            href="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          
          <Link 
            href="/admin/products"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-50 text-orange-600 font-medium"
          >
            <Package size={20} />
            <span>Products</span>
          </Link>
          
          <Link 
            href="/admin/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition w-full"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
              <p className="text-gray-600 mt-1">
                {filteredProducts.length} of {products.length} products
              </p>
            </div>
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md"
            >
              <Plus size={20} />
              Add Product
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products by name, ID, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-3">
              <Filter size={20} className="text-gray-600" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === 'all'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  All ({products.length})
                </button>
                <button
                  onClick={() => setFilterType('visible')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === 'visible'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <Eye size={16} className="inline mr-1" />
                  Visible ({products.filter(p => p.visible).length})
                </button>
                <button
                  onClick={() => setFilterType('hidden')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === 'hidden'
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <EyeOff size={16} className="inline mr-1" />
                  Hidden ({products.filter(p => !p.visible).length})
                </button>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const price = Number(product.variant?.price || 0);
                  const salePrice = Number(product.variant?.sale_price || 0);
                  const onSale = product.variant?.on_sale || false;
                  const stock = Number(product.variant?.stock || 0);

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.variant?.images?.[0] ? (
                              <Image
                                src={product.variant.images[0]}
                                alt={product.title}
                                width={64}
                                height={64}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package size={24} />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 max-w-xs truncate">{product.title}</h3>
                            <p className="text-sm text-gray-500">ID: {product.id.slice(0, 20)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            £{onSale ? salePrice.toFixed(2) : price.toFixed(2)}
                          </p>
                          {onSale && (
                            <p className="text-sm text-gray-400 line-through">£{price.toFixed(2)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          stock > 5 
                            ? 'bg-green-100 text-green-800'
                            : stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {stock} in stock
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          product.visible
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
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
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
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

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No products found</p>
                <p className="text-sm">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}