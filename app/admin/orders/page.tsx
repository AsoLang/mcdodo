// Path: app/admin/orders/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, LogOut, ChevronDown, ChevronUp, Truck, Trash2, X } from 'lucide-react';
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
}

type TabType = 'all' | 'unfulfilled' | 'shipped' | 'delivered';
type DateFilter = 'all' | 'today' | 'week' | 'month';
type SortType = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      if (res.status === 401) { router.push('/admin'); return; }
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
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

  // --- FIXED DISPATCH FUNCTION ---
  const handleDispatch = async (orderId: string) => {
    setIsDispatching(true);
    try {
      // FIX: Matches your backend route: /api/admin/orders/[id]/dispatch
      const res = await fetch(`/api/admin/orders/${orderId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber, carrier }),
      });

      if (res.ok) {
        // Update local state instantly
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

  const filterByTab = (list: Order[]) => {
    if (activeTab === 'all') return list;
    return list.filter(o => getNormalizedStatus(o.fulfillment_status) === activeTab);
  };

  const filterByDate = (list: Order[]) => {
    if (dateFilter === 'all') return list;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return list.filter(o => {
      const orderDate = new Date(o.created_at);
      if (dateFilter === 'today') return orderDate >= today;
      if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo;
      }
      if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return orderDate >= monthAgo;
      }
      return true;
    });
  };

  const filterBySearch = (list: Order[]) => {
    if (!search) return list;
    const query = search.toLowerCase();
    return list.filter(o =>
      (o.customer_email || '').toLowerCase().includes(query) ||
      (o.customer_name || '').toLowerCase().includes(query) ||
      String(o.order_number || '').includes(query) ||
      (o.id || '').toLowerCase().includes(query)
    );
  };

  const sortOrders = (list: Order[]) => {
    const sorted = [...list];
    if (sortBy === 'newest') sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === 'oldest') sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sortBy === 'highest') sorted.sort((a, b) => Number(b.total) - Number(a.total));
    else if (sortBy === 'lowest') sorted.sort((a, b) => Number(a.total) - Number(b.total));
    return sorted;
  };

  // --- PAGINATION CALCS ---
  const filteredOrders = sortOrders(filterBySearch(filterByDate(filterByTab(orders))));
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- STATS ---
  const stats = {
    total: orders.length,
    unfulfilled: orders.filter(o => getNormalizedStatus(o.fulfillment_status) === 'unfulfilled').length,
    shipped: orders.filter(o => getNormalizedStatus(o.fulfillment_status) === 'shipped').length,
    revenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
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
               <p className="text-sm text-gray-500">{stats.total} total orders found</p>
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold rounded-lg text-sm hover:bg-gray-800">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase">Total Orders</div>
            <div className="text-2xl font-black text-black mt-1">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase">Unfulfilled</div>
            <div className="text-2xl font-black text-orange-600 mt-1">{stats.unfulfilled}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase">Shipped</div>
            <div className="text-2xl font-black text-green-600 mt-1">{stats.shipped}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase">Revenue</div>
            <div className="text-2xl font-black text-black mt-1">£{stats.revenue.toFixed(2)}</div>
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
                            <td colSpan={6} className="p-0 border-none">
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
                                            <span className="text-sm font-bold text-black">{item.name || item.product_title}</span>
                                          </div>
                                          <span className="text-sm font-bold text-gray-900">£{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Shipping Info - FIXED ADDRESS LOGIC */}
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Delivery Details</h4>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-sm space-y-4">
                                      <div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Shipping Address</div>
                                        <div className="text-gray-900 leading-relaxed font-medium">
                                          {formatAddress(order)}
                                        </div>
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
          
          {filteredOrders.length === 0 && (
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
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium"
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
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none font-medium"
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