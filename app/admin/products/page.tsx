// Path: app/admin/products/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Search, Edit, Trash2, Eye, EyeOff, Package, Check, X, ChevronDown, LogOut } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  categories: string;
  visible: boolean;
  variant?: {
    id: string;
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
  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: number }>({});
  const [savingQuantity, setSavingQuantity] = useState<{ [key: string]: boolean }>({});
  const [togglingVisibility, setTogglingVisibility] = useState<{ [key: string]: boolean }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      if (!res.ok) router.push('/admin');
    } catch {
      router.push('/admin');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      
      if (!res.ok) {
        console.error('Failed to fetch products, status:', res.status);
        if (res.status === 401) {
          router.push('/admin');
        }
        return;
      }
      
      const data = await res.json();
      
      // Make sure data is an array
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Products data is not an array:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
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

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setEditingQuantity(prev => ({ ...prev, [productId]: newQuantity }));
  };

  const saveQuantity = async (product: Product) => {
    if (!product.variant) return;
    
    const newQuantity = editingQuantity[product.id];
    if (newQuantity === undefined) return;

    setSavingQuantity(prev => ({ ...prev, [product.id]: true }));

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: product.title,
          description: '',
          categories: product.categories,
          visible: product.visible,
          featured: false,
          variant: {
            ...product.variant,
            stock: newQuantity
          }
        }),
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { ...p, variant: { ...p.variant!, stock: newQuantity } }
            : p
        ));
        setEditingQuantity(prev => {
          const newState = { ...prev };
          delete newState[product.id];
          return newState;
        });
      } else {
        alert('Failed to update quantity');
      }
    } catch (error) {
      alert('Error updating quantity');
    } finally {
      setSavingQuantity(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const toggleVisibility = async (product: Product) => {
    setTogglingVisibility(prev => ({ ...prev, [product.id]: true }));

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: product.title,
          description: '',
          categories: product.categories,
          visible: !product.visible,
          featured: false,
          variant: product.variant
        }),
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { ...p, visible: !p.visible }
            : p
        ));
      } else {
        alert('Failed to update visibility');
      }
    } catch (error) {
      alert('Error updating visibility');
    } finally {
      setTogglingVisibility(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const cancelQuantityEdit = (productId: string) => {
    setEditingQuantity(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  const getStockStatus = (stock: number): 'out' | 'low' | 'in' => {
    if (stock === 0) return 'out';
    if (stock <= 5) return 'low';
    return 'in';
  };

  // Get unique categories - safely handle empty products
  const categories = Array.from(new Set(products.map(p => p.categories).filter(Boolean)));

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.categories.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.categories.includes(selectedCategory);

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

    return matchesSearch && matchesCategory && matchesStock && matchesSale && matchesVisibility;
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
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-[1920px] mx-auto px-4 py-6">
        {/* Header with Logout on SAME line */}
        <div className="flex flex-row items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <button className="p-2 hover:bg-white rounded-lg transition">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
              <p className="text-sm text-gray-600">{filteredProducts.length} of {products.length} products</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/products/new">
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm whitespace-nowrap">
                + Add Product
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition shadow-md text-sm whitespace-nowrap"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Search and Category Dropdown */}
        <div className="mb-4 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900"
            />
          </div>
          
          <div className="relative w-64">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-gray-900 appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.split('/').filter(Boolean).join(' > ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex gap-6 text-xs">
          {/* Visibility Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-semibold">Visibility:</span>
            <button
              onClick={() => setVisibilityFilter('all')}
              className={`px-2 py-1 rounded ${visibilityFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setVisibilityFilter('visible')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${visibilityFilter === 'visible' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <Eye size={12} /> Visible
            </button>
            <button
              onClick={() => setVisibilityFilter('hidden')}
              className={`px-2 py-1 rounded flex items-center gap-1 ${visibilityFilter === 'hidden' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <EyeOff size={12} /> Hidden
            </button>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-semibold">Stock:</span>
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2 py-1 rounded ${stockFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('in-stock')}
              className={`px-2 py-1 rounded ${stockFilter === 'in-stock' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              In ({stockCounts.inStock})
            </button>
            <button
              onClick={() => setStockFilter('low-stock')}
              className={`px-2 py-1 rounded ${stockFilter === 'low-stock' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Low ({stockCounts.lowStock})
            </button>
            <button
              onClick={() => setStockFilter('out-of-stock')}
              className={`px-2 py-1 rounded ${stockFilter === 'out-of-stock' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Out ({stockCounts.outOfStock})
            </button>
          </div>

          {/* Sale Filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-semibold">Sale:</span>
            <button
              onClick={() => setSaleFilter('all')}
              className={`px-2 py-1 rounded ${saleFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setSaleFilter('on-sale')}
              className={`px-2 py-1 rounded ${saleFilter === 'on-sale' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              On Sale
            </button>
            <button
              onClick={() => setSaleFilter('regular')}
              className={`px-2 py-1 rounded ${saleFilter === 'regular' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Regular
            </button>
          </div>
        </div>

        {/* Products Grid - 7 per row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {filteredProducts.map((product, index) => {
            const price = Number(product.variant?.price || 0);
            const salePrice = Number(product.variant?.sale_price || 0);
            const onSale = product.variant?.on_sale || false;
            const stock = Number(product.variant?.stock || 0);
            const stockStatus = getStockStatus(stock);
            const isEditingQty = editingQuantity[product.id] !== undefined;
            const currentQty = isEditingQty ? editingQuantity[product.id] : stock;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.01 }}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                <div className="relative aspect-square bg-gray-50">
                  {product.variant?.images?.[0] ? (
                    <Image
                      src={product.variant.images[0]}
                      alt={product.title}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package size={24} />
                    </div>
                  )}
                  {onSale && (
                    <div className="absolute top-1 right-1 bg-orange-500 text-white px-1 rounded text-[10px] font-bold">
                      SALE
                    </div>
                  )}
                  {!product.visible && (
                    <div className="absolute top-1 left-1 bg-gray-700 text-white px-1 rounded text-[10px] font-bold">
                      <EyeOff size={10} />
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 min-h-[2rem] mb-1">
                    {product.title}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xs font-bold text-gray-900">
                      £{onSale ? salePrice.toFixed(2) : price.toFixed(2)}
                    </span>
                    {onSale && (
                      <span className="text-[10px] text-gray-400 line-through">
                        £{price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Inline Quantity Editor */}
                  <div className="mb-2">
                    {isEditingQty ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={currentQty}
                          onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                          className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded text-gray-900"
                          autoFocus
                        />
                        <button
                          onClick={() => saveQuantity(product)}
                          disabled={savingQuantity[product.id]}
                          className="p-0.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => cancelQuantityEdit(product.id)}
                          className="p-0.5 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleQuantityChange(product.id, stock)}
                        className={`w-full text-center px-2 py-0.5 rounded text-[10px] font-medium ${
                          stockStatus === 'in'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : stockStatus === 'low'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        Stock: {stock}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleVisibility(product)}
                      disabled={togglingVisibility[product.id]}
                      className={`p-1 rounded transition ${
                        product.visible
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      } disabled:opacity-50`}
                      title={product.visible ? 'Hide from website' : 'Show on website'}
                    >
                      {product.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <Link href={`/admin/products/${product.id}`} className="flex-1">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-[10px] font-semibold transition">
                        <Edit size={10} className="inline" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">No products found</p>
            <button
              onClick={() => {
                setSearch('');
                setStockFilter('all');
                setSaleFilter('all');
                setVisibilityFilter('all');
                setSelectedCategory('all');
              }}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}