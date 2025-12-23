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
      sorted.sort((a, b) => {
        const numA = Number(a.order_number) || 0;
        const numB = Number(b.order_number) || 0;
        return numB - numA;
      });
    }
    else if (sortBy === 'oldest') {
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
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: orders.length,
    unfulfilled: orders.filter(o => getNormalizedStatus(o.fulfillment_status) === 'unfulfilled').length,
    shipped: orders.filter(o => getNormalizedStatus(o.fulfillment_status) === 'shipped').length,
    revenue: orders.reduce((sum, o) => sum + Number(o.total), 0),
  };

  const formatAddress = (order: Order) => {
    const parts = [
      order.shipping_address_line1,
      order.shipping_address_line2,
      order.shipping_city,
      order.shipping_postal_code,
      order.shipping_country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 font-bold">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16 md:pt-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200  shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin/products" className="flex items-center gap-2 text-gray-600 hover:text-black font-bold transition">
                <ArrowLeft size={20} />
                <span>Back to Products</span>
              </Link>
              <div>
                <h1 className="text-2xl font-black text-black">Orders</h1>
                <p className="text-sm text-gray-500 font-medium">{stats.total} orders found</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-bold"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</div>
            <div className="text-3xl font-black text-black mt-1">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unfulfilled</div>
            <div className="text-3xl font-black text-orange-600 mt-1">{stats.unfulfilled}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shipped</div>
            <div className="text-3xl font-black text-green-600 mt-1">{stats.shipped}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</div>
            <div className="text-3xl font-black text-black mt-1">£{stats.revenue.toFixed(2)}</div>
          </div>
        </div>

        {/* Tabs + Search + Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tabs */}
            <div className="flex gap-2">
              {(['all', 'unfulfilled', 'shipped'] as TabType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition capitalize ${
                    activeTab === tab ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
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
                            <span className="font-black text-black">#{order.order_number || String(order.id).slice(0, 6)}</span>
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
                          {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-sm space-y-2.5">
                                      <div className="pb-2 border-b border-gray-100">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Customer</div>
                                        <div className="font-bold text-black">{order.customer_name || 'Guest'}</div>
                                        <div className="text-gray-600">{order.customer_email || 'N/A'}</div>
                                      </div>
                                      
                                      <div className="pb-2 border-b border-gray-100">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Shipping Address</div>
                                        {order.shipping_address_line1 ? (
                                          <div className="text-gray-900 leading-relaxed">
                                            <div>{order.shipping_address_line1}</div>
                                            {order.shipping_address_line2 && <div>{order.shipping_address_line2}</div>}
                                            <div>{order.shipping_city}</div>
                                            <div>{order.shipping_postal_code}</div>
                                            <div className="font-semibold">{order.shipping_country}</div>
                                          </div>
                                        ) : (
                                          <div className="text-gray-500 italic">Address not available</div>
                                        )}
                                      </div>
                                      
                                      <div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Delivery Method</div>
                                        <div className="font-medium text-black">Standard Delivery</div>
                                      </div>
                                      
                                      {order.tracking_number && (
                                        <div className="pt-2 border-t border-gray-100">
                                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tracking</div>
                                          <div className="font-mono text-sm text-black">{order.tracking_number}</div>
                                        </div>
                                      )}
                                      
                                      <div className="pt-2 border-t border-gray-100">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Session ID</div>
                                        <div className="font-mono text-xs text-gray-400 break-all" title={order.stripe_session_id || ''}>
                                          {order.stripe_session_id || 'N/A'}
                                        </div>
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