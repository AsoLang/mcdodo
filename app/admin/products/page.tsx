// Path: app/admin/products/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Search, Edit } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  categories: string;
  visible: boolean;
  variant?: {
    price: number;
    sale_price: number;
    on_sale: boolean;
    stock: number;
    images: string[];
  };
}

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type SaleFilter = 'all' | 'on-sale' | 'regular';
type VisibilityFilter = 'all' | 'visible' | 'hidden';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [saleFilter, setSaleFilter] = useState<SaleFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('visible');
  const router = useRouter();

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

  const getStockStatus = (stock: number): 'out' | 'low' | 'in' => {
    if (stock === 0) return 'out';
    if (stock <= 5) return 'low';
    return 'in';
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                         p.categories.toLowerCase().includes(search.toLowerCase());
    
    const stock = p.variant?.stock || 0;
    const stockStatus = getStockStatus(stock);
    const matchesStock = 
      stockFilter === 'all' ||
      (stockFilter === 'in-stock' && stockStatus === 'in') ||
      (stockFilter === 'low-stock' && stockStatus === 'low') ||
      (stockFilter === 'out-of-stock' && stockStatus === 'out');

    const matchesSale = 
      saleFilter === 'all' ||
      (saleFilter === 'on-sale' && p.variant?.on_sale) ||
      (saleFilter === 'regular' && !p.variant?.on_sale);

    const matchesVisibility = 
      visibilityFilter === 'all' ||
      (visibilityFilter === 'visible' && p.visible) ||
      (visibilityFilter === 'hidden' && !p.visible);

    return matchesSearch && matchesStock && matchesSale && matchesVisibility;
  });

  const stockCounts = {
    all: products.length,
    inStock: products.filter(p => getStockStatus(p.variant?.stock || 0) === 'in').length,
    lowStock: products.filter(p => getStockStatus(p.variant?.stock || 0) === 'low').length,
    outOfStock: products.filter(p => getStockStatus(p.variant?.stock || 0) === 'out').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-orange-600">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
            <span className="text-sm text-gray-500">({filteredProducts.length} products)</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Filters - Always Visible */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stock Filter */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Stock Status</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    stockFilter === 'all' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Products ({stockCounts.all})
                </button>
                <button
                  onClick={() => setStockFilter('in-stock')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    stockFilter === 'in-stock' 
                      ? 'bg-green-500 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  In Stock ({stockCounts.inStock})
                </button>
                <button
                  onClick={() => setStockFilter('low-stock')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    stockFilter === 'low-stock' 
                      ? 'bg-yellow-500 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Low Stock ≤5 ({stockCounts.lowStock})
                </button>
                <button
                  onClick={() => setStockFilter('out-of-stock')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    stockFilter === 'out-of-stock' 
                      ? 'bg-red-500 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Out of Stock ({stockCounts.outOfStock})
                </button>
              </div>
            </div>

            {/* Sale Filter */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Sale Status</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSaleFilter('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    saleFilter === 'all' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Products
                </button>
                <button
                  onClick={() => setSaleFilter('on-sale')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    saleFilter === 'on-sale' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  On Sale Only
                </button>
                <button
                  onClick={() => setSaleFilter('regular')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    saleFilter === 'regular' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Regular Price
                </button>
              </div>
            </div>

            {/* Visibility Filter */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Visibility</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setVisibilityFilter('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    visibilityFilter === 'all' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Products
                </button>
                <button
                  onClick={() => setVisibilityFilter('visible')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    visibilityFilter === 'visible' 
                      ? 'bg-green-500 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Visible on Site
                </button>
                <button
                  onClick={() => setVisibilityFilter('hidden')}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    visibilityFilter === 'hidden' 
                      ? 'bg-gray-600 text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Hidden from Site
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product, index) => {
            const stock = product.variant?.stock || 0;
            const stockStatus = getStockStatus(stock);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link href={`/admin/products/${product.id}`}>
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden">
                    <div className="relative w-full h-32 bg-gray-50 p-2">
                      {product.variant?.images?.[0] ? (
                        <Image
                          src={product.variant.images[0]}
                          alt={product.title}
                          fill
                          className="object-contain p-2"
                          sizes="200px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                      {product.variant?.on_sale && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                          SALE
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                        {product.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {product.variant?.on_sale ? (
                            <>
                              <span className="text-sm font-bold text-orange-500">
                                £{Number(product.variant.sale_price).toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-400 line-through">
                                £{Number(product.variant.price).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-gray-900">
                              £{Number(product.variant?.price || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          stockStatus === 'out' ? 'bg-red-100 text-red-700' :
                          stockStatus === 'low' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {stock === 0 ? 'Out' : stock <= 5 ? `Low: ${stock}` : stock}
                        </span>
                        {!product.visible && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                            Hidden
                          </span>
                        )}
                        <Edit size={14} className="text-orange-600 ml-auto" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No products found matching your filters
          </div>
        )}
      </main>
    </div>
  );
}