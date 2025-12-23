// Path: app/admin/orders/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, LogOut, ChevronDown, ChevronUp, Truck, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  order_number: string | number;
  stripe_session_id: string | null; // Allow null
  customer_email: string | null;    // Allow null
  customer_name: string | null;     // Allow null
  shipping_city: string | null;
  items: any;
  total: number;
  fulfillment_status: string;
  tracking_number: string | null;
  created_at: string;
}

type TabType = 'all' | 'unfulfilled' | 'shipped' | 'delivered';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type SortType = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('Royal Mail');
  
  const itemsPerPage = 20;
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchOrders();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      if (!res.ok) router.push('/admin');
    } catch {
      router.push('/admin');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
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

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        // Refresh from server to be sure
        fetchOrders();
      } else {
        alert('Failed to delete order. Check console for details.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting order');
    }
  };

  const handleDispatch = async (orderId: string) => {
    if (!trackingNumber) {
      alert('Please enter tracking number');
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber, carrier }),
      });

      if (res.ok) {
        alert('Order dispatched & email sent!');
        setSelectedOrder(null);
        setTrackingNumber('');
        fetchOrders();
      }
    } catch (error) {
      alert('Error dispatching order');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  // --- SAFE FILTERING LOGIC ---
  const getNormalizedStatus = (status: string) => status?.toLowerCase() || 'unfulfilled';

  const filterByTab = (orders: Order[]) => {
    if (activeTab === 'all') return orders;
    return orders.filter(o => getNormalizedStatus(o.fulfillment_status) === activeTab);
  };

  const filterByDate = (orders: Order[]) => {
    if (dateFilter === 'all') return orders;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(o => {
      if (!o.created_at) return false;
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

  const filterBySearch = (orders: Order[]) => {
    if (!search) return orders;
    const query = search.toLowerCase();
    return orders.filter(o =>
      (o.customer_email || '').toLowerCase().includes(query) ||
      (o.customer_name || '').toLowerCase().includes(query) ||
      String(o.order_number || '').includes(query) ||
      (o.id || '').toLowerCase().includes(query) ||
      (o.stripe_session_id || '').toLowerCase().includes(query)
    );
  };

  const sortOrders = (orders: Order[]) => {
    const sorted = [...orders];
    
    if (sortBy === 'newest') {
      // UPDATED: Sort by Order Number (High to Low)
      sorted.sort((a, b) => {
        const numA = Number(a.order_number) || 0;
        const numB = Number(b.order_number) || 0;
        return numB - numA;
      });
    }
    else if (sortBy === 'oldest') {
      // UPDATED: Sort by Order Number (Low to High)
      sorted.sort((a, b) => {
        const numA = Number(a.order_number) || 0;
        const numB = Number(b.order_number) || 0;
        return numA - numB;
      });
    }
    else if (sortBy === 'highest') sorted.sort((a, b) => Number(b.total) - Number(a.total));
    else if (sortBy === 'lowest') sorted.sort((a, b) => Number(a.total) - Number(b.total));
    
    return sorted;
  };

  const filteredOrders = sortOrders(filterBySearch(filterByDate(filterByTab(orders))));
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, activeTab, dateFilter, sortBy]);

  const parseItems = (items: any) => {
    if (typeof items === 'string') {
      try { return JSON.parse(items); } catch { return []; }
    }
    return Array.isArray(items) ? items : [];
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-black font-medium">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 pt-24 pb-12 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Added "Admin" Button as requested */}
            <Link href="/admin/dashboard" className="px-4 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 border border-gray-200 transition font-bold text-black flex items-center gap-2">
              <ArrowLeft size={18} />
              Admin
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-black tracking-tight">Orders</h1>
              <p className="text-gray-600 font-medium mt-1">
                {filteredOrders.length} orders found
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg">
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex flex-col xl:flex-row gap-4 justify-between">
            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
              {['all', 'unfulfilled', 'shipped'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as TabType)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition capitalize ${
                    activeTab === tab 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search order #, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none text-black font-medium"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-black focus:ring-2 focus:ring-black outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest £</option>
                <option value="lowest">Lowest £</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedOrders.map((order) => {
                  const status = getNormalizedStatus(order.fulfillment_status);
                  const isUnfulfilled = status === 'unfulfilled';
                  const items = parseItems(order.items);
                  
                  // Use order_number or fallback to a safe ID slice
                  const displayId = order.order_number 
                    ? `#${order.order_number}` 
                    : `#${order.id?.slice(0, 6) || '???'}`;

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50 transition-colors group">
                        {/* Order ID & Expand */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            className="flex items-center gap-2 font-bold text-black hover:text-orange-600 transition"
                          >
                            {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {displayId}
                          </button>
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-black">{order.customer_name || 'Guest'}</div>
                          <div className="text-sm text-gray-500">{order.customer_email || 'No email'}</div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            status === 'shipped' || status === 'fulfilled' ? 'bg-green-100 text-green-700' :
                            status === 'unfulfilled' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {status}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                          {order.created_at 
                            ? new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'N/A'
                          }
                        </td>

                        {/* Total */}
                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-black">
                          £{Number(order.total).toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isUnfulfilled && (
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
                                      {items.length > 0 ? (
                                        items.map((item: any, idx: number) => (
                                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-xs font-bold text-gray-500">
                                                {item.quantity}x
                                              </div>
                                              <span className="text-sm font-bold text-black">{item.name || item.product_title || 'Unknown Item'}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">£{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-gray-500 italic">No item details available.</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Shipping Info */}
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Delivery Details</h4>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-sm space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Address:</span>
                                        <span className="font-medium text-black text-right">{order.shipping_city || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Method:</span>
                                        <span className="font-medium text-black">Standard Delivery</span>
                                      </div>
                                      <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                                        <span className="text-gray-500">Session ID:</span>
                                        <span className="font-mono text-xs text-gray-400" title={order.stripe_session_id || ''}>
                                          {order.stripe_session_id ? `${order.stripe_session_id.slice(0, 16)}...` : 'N/A'}
                                        </span>
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
                <span className="text-sm font-bold text-black">
                  #{selectedOrder.order_number || selectedOrder.id.slice(0, 6)}
                </span>
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
                className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg mt-2"
              >
                Confirm Dispatch
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}