// Path: app/admin/orders/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, LogOut, ChevronDown, ChevronUp, Truck, Trash2, X, Download, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPE DEFINITIONS ---
interface Order {
  id: string;
  order_number: string | number;
  stripe_session_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  items: any;
  total: number;
  fulfillment_status: string;
  tracking_number: string | null;
  created_at: string;
  weight_grams: number | null;
  service_type: string;
}

type TabType = 'all' | 'unfulfilled' | 'shipped' | 'delivered';
type DateFilter = 'all' | 'today' | 'week' | 'month';
type SortType = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [stats, setStats] = useState<{ total: number; unfulfilled: number; shipped: number; delivered: number; revenue: number }>({
    total: 0,
    unfulfilled: 0,
    shipped: 0,
    delivered: 0,
    revenue: 0,
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Filtering & Sorting State
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  
  // UI State
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Dispatch Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('Royal Mail');
  const [isDispatching, setIsDispatching] = useState(false);

  // Royal Mail Export State
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [exportingOrder, setExportingOrder] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchOrders();
  }, [debouncedSearch, activeTab, dateFilter, sortBy, currentPage]);

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [activeTab, dateFilter, sortBy, currentPage]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        search: debouncedSearch,
        status: activeTab,
        date: dateFilter,
        sort: sortBy,
      });
      const res = await fetch(`/api/admin/orders?${params.toString()}`, { cache: 'no-store' });
      if (res.status === 401) { router.push('/admin'); return; }
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalOrdersCount(Number(data.total || 0));
        if (data.stats) {
          setStats({
            total: Number(data.stats.total || 0),
            unfulfilled: Number(data.stats.unfulfilled || 0),
            shipped: Number(data.stats.shipped || 0),
            delivered: Number(data.stats.delivered || 0),
            revenue: Number(data.stats.revenue || 0),
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  // --- ROYAL MAIL FUNCTIONS ---

  const updateShipping = async (orderId: string, data: { weight_grams?: number; service_type?: string }) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, ...data } : o
      ));
    } catch (error) {
      console.error('Failed to update shipping:', error);
    }
  };

  const exportSingleOrder = async (orderId: string) => {
    setExportingOrder(orderId);
    try {
      const res = await fetch('/api/admin/royal-mail-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: [orderId] })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const order = orders.find(o => o.id === orderId);
        a.download = `royal-mail-order-${order?.order_number || orderId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await res.json();
        alert(`Export failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting order');
    } finally {
      setExportingOrder(null);
    }
  };

  const toggleExportSelection = (orderId: string) => {
    setSelectedForExport(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const exportSelectedOrders = async () => {
    if (selectedForExport.size === 0) {
      alert('Please select orders to export');
      return;
    }

    try {
      const res = await fetch('/api/admin/royal-mail-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedForExport) })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `royal-mail-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSelectedForExport(new Set());
      } else {
        const error = await res.json();
        alert(`Export failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting orders');
    }
  };

  // --- ACTIONS (Delete & Dispatch) ---

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        alert('Failed to delete order.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting order');
    }
  };

  const handleDispatch = async (orderId: string) => {
    setIsDispatching(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber, carrier }),
      });

      if (res.ok) {
        const updatedOrders = orders.map(o => 
          o.id === orderId 
            ? { ...o, fulfillment_status: 'shipped', tracking_number: trackingNumber } 
            : o
        );
        setOrders(updatedOrders);
        setSelectedOrder(null);
        setTrackingNumber('');
      } else {
        alert('Failed to update order');
      }
    } catch (error) {
      console.error(error);
      alert('Error dispatching order');
    } finally {
      setIsDispatching(false);
    }
  };

  // --- FILTERING LOGIC ---

  const getNormalizedStatus = (status: string) => status?.toLowerCase() || 'unfulfilled';

  // --- PAGINATION CALCS ---
  const totalPages = Math.ceil(totalOrdersCount / itemsPerPage);
  const paginatedOrders = orders;

  // --- STATS ---
  const statsView = {
    total: stats.total,
    unfulfilled: stats.unfulfilled,
    shipped: stats.shipped,
    revenue: stats.revenue,
  };

  // --- ADDRESS FORMATTER ---
  const formatAddress = (order: Order) => {
    const parts = [
      order.shipping_address_line1,
      order.shipping_address_line2,
      order.shipping_city,
      order.shipping_postal_code,
      order.shipping_country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-24 px-4 md:px-8">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
             <Link href="/admin/dashboard" className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
               <ArrowLeft size={20} className="text-gray-600" />
             </Link>
             <div>
               <h1 className="text-3xl font-black text-gray-900">Orders</h1>
               <p className="text-sm text-gray-500">{statsView.total} total orders found</p>
             </div>
          </div>
          <div className="flex gap-3">
            {selectedForExport.size > 0 && (
              <button
                onClick={exportSelectedOrders}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700"
              >
                <Download size={16} /> Export Selected ({selectedForExport.size})
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold rounded-lg text-sm hover:bg-gray-800">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase">Total Orders</div>
            <div className="text-2xl font-black text-black mt-1">{statsView.total}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase">Unfulfilled</div>
            <div className="text-2xl font-black text-orange-600 mt-1">{statsView.unfulfilled}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase">Shipped</div>
            <div className="text-2xl font-black text-green-600 mt-1">{statsView.shipped}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase">Revenue</div>
            <div className="text-2xl font-black text-black mt-1">£{statsView.revenue.toFixed(2)}</div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Tabs */}
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {(['all', 'unfulfilled', 'shipped', 'delivered'] as TabType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition capitalize whitespace-nowrap ${
                    activeTab === tab ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:min-w-[250px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Search order #, email..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-black outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Total</option>
                <option value="lowest">Lowest Total</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForExport(new Set(orders.filter(o => getNormalizedStatus(o.fulfillment_status) === 'unfulfilled').map(o => o.id)));
                        } else {
                          setSelectedForExport(new Set());
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOrders.map(order => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const isExpanded = expandedOrder === order.id;
                  const statusNorm = getNormalizedStatus(order.fulfillment_status);

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50 transition cursor-pointer group">
                        <td className="px-6 py-4">
                          {statusNorm === 'unfulfilled' && (
                            <input
                              type="checkbox"
                              checked={selectedForExport.has(order.id)}
                              onChange={() => toggleExportSelection(order.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            <span className="font-black text-black">#{order.order_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-black">{order.customer_name || 'Guest'}</div>
                          <div className="text-xs text-gray-500">{order.customer_email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            statusNorm === 'shipped' ? 'bg-green-100 text-green-700' :
                            statusNorm === 'delivered' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.fulfillment_status || 'Unfulfilled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-black">
                          £{Number(order.total).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {statusNorm === 'unfulfilled' && (
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition"
                              >
                                <Truck size={14} /> Dispatch
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(order.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Order"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row Details */}
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <tr>
                            <td colSpan={7} className="p-0 border-none">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-gray-50 border-t border-gray-200 overflow-hidden"
                              >
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {/* Items List */}
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items Ordered</h4>
                                    <div className="space-y-3">
                                      {items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-xs font-bold text-gray-500">
                                              {item.quantity}x
                                            </div>
                                            <div className="flex flex-col">
                                              {(() => {
                                                const itemName = item.name || item.product_title || 'Unnamed item';
                                                const productUrl = item.product_url || item.productUrl;
                                                return productUrl ? (
                                                  <Link
                                                    href={`/shop/p/${productUrl}`}
                                                    className="text-sm font-bold text-black hover:text-orange-600 hover:underline"
                                                  >
                                                    {itemName}
                                                  </Link>
                                                ) : (
                                                  <span className="text-sm font-bold text-black">{itemName}</span>
                                                );
                                              })()}
                                              {(item.color || item.size) && (
                                                <span className="text-xs text-gray-500">
                                                  {[item.color, item.size].filter(Boolean).join(' · ')}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <span className="text-sm font-bold text-gray-900">£{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Shipping Info */}
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Delivery Details</h4>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-sm space-y-4">
                                      <div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Shipping Address</div>
                                        <div className="text-gray-900 leading-relaxed font-medium">
                                          {formatAddress(order)}
                                        </div>
                                      </div>

                                      {/* Royal Mail Fields */}
                                      <div className="pt-3 border-t border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                          <Package size={14} className="text-blue-600" />
                                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Royal Mail Details</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                          <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Weight (g)</label>
                                            <input 
                                              type="number"
                                              defaultValue={order.weight_grams || 100}
                                              onBlur={(e) => updateShipping(order.id, {weight_grams: parseInt(e.target.value)})}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                              placeholder="100"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Service</label>
                                            <select 
                                              defaultValue={order.service_type || 'small_parcel'}
                                              onChange={(e) => updateShipping(order.id, {service_type: e.target.value})}
                                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                              <option value="large_letter">Large Letter</option>
                                              <option value="small_parcel">Small Parcel</option>
                                            </select>
                                          </div>
                                        </div>
                                        {statusNorm === 'unfulfilled' && (
                                          <button
                                            onClick={() => exportSingleOrder(order.id)}
                                            disabled={exportingOrder === order.id}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                                          >
                                            <Download size={14} />
                                            {exportingOrder === order.id ? 'Exporting...' : 'Export to Royal Mail CSV'}
                                          </button>
                                        )}
                                      </div>
                                      
                                      {order.tracking_number && (
                                        <div className="pt-2 border-t border-gray-100">
                                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tracking</div>
                                          <div className="font-mono text-sm text-black">{order.tracking_number}</div>
                                        </div>
                                      )}
                                      
                                      <div className="pt-2 border-t border-gray-100">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Session ID</div>
                                        <div className="font-mono text-xs text-gray-400 break-all">{order.stripe_session_id || 'N/A'}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {orders.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-gray-400 mb-2">No orders found</div>
              <button onClick={() => {setSearch(''); setActiveTab('all');}} className="text-orange-600 font-bold hover:underline">
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-bold text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 font-medium text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-bold text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-black">Dispatch Order</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <X size={20} className="text-black" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Order:</span>
                <span className="text-sm font-bold text-black">#{selectedOrder.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Customer:</span>
                <span className="text-sm font-bold text-black">{selectedOrder.customer_name || 'Guest'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1.5">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium text-gray-900"
                >
                  <option>Royal Mail</option>
                  <option>DPD</option>
                  <option>Evri</option>
                  <option>DHL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1.5">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. GB234..."
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium text-gray-900"
                />
              </div>

              <button
                onClick={() => handleDispatch(selectedOrder.id)}
                disabled={isDispatching}
                className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg mt-2 disabled:opacity-50"
              >
                {isDispatching ? 'Processing...' : 'Confirm Dispatch'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
