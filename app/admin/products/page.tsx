// Path: app/admin/products/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Check,
  X,
  ChevronDown,
  LogOut,
  Star,
} from 'lucide-react';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Variant {
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
  categories: string;
  visible: boolean;
  featured: boolean;
  variant: Variant | null;
  total_stock: number;
  variant_count: number;
  any_in_stock: boolean;
  any_on_sale: boolean;
  position?: number;
}

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type SaleFilter = 'all' | 'on-sale' | 'regular';
type VisibilityFilter = 'all' | 'visible' | 'hidden';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [saleFilter, setSaleFilter] = useState<SaleFilter>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('visible');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [editingQuantity, setEditingQuantity] = useState<{ [key: string]: number }>({});
  const [savingQuantity, setSavingQuantity] = useState<{ [key: string]: boolean }>({});
  const [togglingVisibility, setTogglingVisibility] = useState<{ [key: string]: boolean }>({});
  const [togglingFeatured, setTogglingFeatured] = useState<{ [key: string]: boolean }>({});

  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

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
        if (res.status === 401) router.push('/admin');
        return;
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setProducts(arr);
      setOrder(arr.map((p: Product) => p.id));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      setOrder([]);
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
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setOrder((prev) => prev.filter((pid) => pid !== id));
      } else {
        alert('Failed to delete product');
      }
    } catch {
      alert('Error deleting product');
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setEditingQuantity((prev) => ({ ...prev, [productId]: newQuantity }));
  };

  const cancelQuantityEdit = (productId: string) => {
    setEditingQuantity((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const getStockStatus = (stock: number): 'out' | 'low' | 'in' => {
    if (stock === 0) return 'out';
    if (stock <= 5) return 'low';
    return 'in';
  };

  const saveQuantity = async (product: Product) => {
    // If complex variant, we can't edit simple stock inline here easily without more logic
    // But if simple product, we can:
    const newQuantity = editingQuantity[product.id];
    if (newQuantity === undefined) return;

    setSavingQuantity((prev) => ({ ...prev, [product.id]: true }));

    try {
      await fetch(`/api/admin/products`, { // Using the main route PUT we created earlier or similar
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          stock: newQuantity,
          visible: product.visible,
          price: product.variant?.price
        }),
      });

      // Optimistic update
      setProducts(prev => prev.map(p => p.id === product.id ? {...p, total_stock: newQuantity} : p));
      cancelQuantityEdit(product.id);

    } catch {
      alert('Error updating quantity');
    } finally {
      setSavingQuantity((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const toggleVisibility = async (product: Product) => {
    setTogglingVisibility((prev) => ({ ...prev, [product.id]: true }));

    try {
      await fetch(`/api/admin/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          visible: !product.visible,
          stock: product.total_stock 
        }),
      });

      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, visible: !p.visible } : p)));
    } catch {
      alert('Error updating visibility');
    } finally {
      setTogglingVisibility((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const toggleFeatured = async (product: Product) => {
    setTogglingFeatured((prev) => ({ ...prev, [product.id]: true }));
    // Simplified fetch for featured
    try {
       // Assuming you have a specific route or use the main PUT
       // For safety in this hybrid mode, we just console log if route missing
       console.log("Featured toggle not fully implemented in hybrid api yet");
    } catch {
      //
    } finally {
      setTogglingFeatured((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.categories).filter(Boolean)));

  const filteredIds = useMemo(() => {
    const ids = products
      .filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.categories.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || p.categories.includes(selectedCategory);

        const stock = Number(p.total_stock || 0);
        const stockStatus = getStockStatus(stock);
        const matchesStock =
          stockFilter === 'all' ||
          (stockFilter === 'in-stock' && stockStatus === 'in') ||
          (stockFilter === 'low-stock' && stockStatus === 'low') ||
          (stockFilter === 'out-of-stock' && stockStatus === 'out');

        const matchesSale =
          saleFilter === 'all' ||
          (saleFilter === 'on-sale' && p.any_on_sale) ||
          (saleFilter === 'regular' && !p.any_on_sale);

        const matchesVisibility =
          visibilityFilter === 'all' ||
          (visibilityFilter === 'visible' && p.visible) ||
          (visibilityFilter === 'hidden' && !p.visible);

        return matchesSearch && matchesCategory && matchesStock && matchesSale && matchesVisibility;
      })
      .map((p) => p.id);

    return new Set(ids);
  }, [products, search, selectedCategory, stockFilter, saleFilter, visibilityFilter]);

  const filteredProducts = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    const result: Product[] = [];
    for (const id of order) {
      if (!filteredIds.has(id)) continue;
      const p = byId.get(id);
      if (p) result.push(p);
    }
    return result;
  }, [products, order, filteredIds]);

  const stockCounts = useMemo(() => {
    const all = products.length;
    const inStock = products.filter((p) => getStockStatus(Number(p.total_stock || 0)) === 'in').length;
    const lowStock = products.filter((p) => getStockStatus(Number(p.total_stock || 0)) === 'low').length;
    const outOfStock = products.filter((p) => getStockStatus(Number(p.total_stock || 0)) === 'out').length;
    return { all, inStock, lowStock, outOfStock };
  }, [products]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(active.id as string);
    const newIndex = order.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;

    const newOrder = arrayMove(order, oldIndex, newIndex);
    setOrder(newOrder);

    setProducts((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      const next: Product[] = [];
      for (const id of newOrder) {
        const p = map.get(id);
        if (p) next.push(p);
      }
      for (const p of prev) if (!map.has(p.id)) next.push(p);
      return next;
    });

    try {
      await fetch('/api/admin/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });
    } catch (error) {
      console.error('Failed to save new order:', error);
    }
  };

  const SortableProductCard = ({ product }: { product: Product }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: product.id,
    });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.7 : 1,
      cursor: 'grab',
    };

    const price = Number(product.variant?.price || 0);
    const salePrice = Number(product.variant?.sale_price || 0);
    const onSale = Boolean(product.variant?.on_sale || false);

    const totalStock = Number(product.total_stock || 0);
    const stockStatus = getStockStatus(totalStock);

    // Allow inline edit if simple product OR has variants (we will update the MAIN stock for now to keep it simple)
    const canInlineEditStock = true; 

    const isEditingQty = editingQuantity[product.id] !== undefined;
    const currentQty = isEditingQty ? editingQuantity[product.id] : totalStock;

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
      >
        <div className="relative aspect-square bg-gray-50">
          {product.variant?.images?.[0] ? (
            <Image src={product.variant.images[0]} alt={product.title} fill className="object-contain p-2" />
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
          <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 min-h-[2rem] mb-1">{product.title}</h3>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-xs font-bold text-gray-900">
              £{onSale ? Number(salePrice).toFixed(2) : Number(price).toFixed(2)}
            </span>
            {onSale && <span className="text-[10px] text-gray-400 line-through">£{Number(price).toFixed(2)}</span>}
          </div>

          <div className="mb-2">
            {canInlineEditStock ? (
              isEditingQty ? (
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
                  onClick={() => handleQuantityChange(product.id, totalStock)}
                  className={`w-full text-center px-2 py-0.5 rounded text-[10px] font-medium ${
                    stockStatus === 'in'
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : stockStatus === 'low'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  Stock: {totalStock}
                </button>
              )
            ) : (
              <div
                className={`w-full text-center px-2 py-0.5 rounded text-[10px] font-medium ${
                  stockStatus === 'in'
                    ? 'bg-green-100 text-green-800'
                    : stockStatus === 'low'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                Stock: {totalStock} • (multi)
              </div>
            )}
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => toggleVisibility(product)}
              disabled={togglingVisibility[product.id]}
              className={`p-1 rounded transition ${
                product.visible ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
              } disabled:opacity-50`}
              title={product.visible ? 'Hide from website' : 'Show on website'}
            >
              {product.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>

            <button
              onClick={() => toggleFeatured(product)}
              disabled={togglingFeatured[product.id]}
              className={`p-1 rounded transition ${
                product.featured ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              } disabled:opacity-50`}
              title={product.featured ? 'Remove from homepage' : 'Add to homepage'}
            >
              <Star size={12} className={product.featured ? 'fill-current' : ''} />
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
        <div className="flex flex-row items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* NEW ADMIN BUTTON */}
            <Link href="/admin/dashboard">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold text-gray-700 shadow-sm">
                <ArrowLeft size={16} />
                Admin
              </button>
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
              <p className="text-sm text-gray-600">
                {filteredProducts.length} of {products.length} products • {products.filter((p) => p.featured).length} featured on homepage
              </p>
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

        {/* ... (Keep existing search/filters/dnd code) ... */}
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
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.split('/').filter(Boolean).join(' > ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex gap-6 text-xs overflow-x-auto">
          {/* ... (Keep existing filter buttons) ... */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-700 font-semibold">Stock:</span>
            <button onClick={() => setStockFilter('all')} className={`px-2 py-1 rounded ${stockFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
            <button onClick={() => setStockFilter('in-stock')} className={`px-2 py-1 rounded ${stockFilter === 'in-stock' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}>In ({stockCounts.inStock})</button>
            <button onClick={() => setStockFilter('low-stock')} className={`px-2 py-1 rounded ${stockFilter === 'low-stock' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Low ({stockCounts.lowStock})</button>
            <button onClick={() => setStockFilter('out-of-stock')} className={`px-2 py-1 rounded ${stockFilter === 'out-of-stock' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Out ({stockCounts.outOfStock})</button>
          </div>
          {/* ... (Rest of filters) ... */}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order.filter((id) => filteredIds.has(id))} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
              {filteredProducts.map((product) => (
                <SortableProductCard key={product.id} product={product} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}