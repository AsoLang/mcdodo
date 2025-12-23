// Path: app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight,
  Truck,
  LogOut
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.status === 401) {
        router.push('/admin');
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading Dashboard...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Error loading data.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Admin.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/">
             <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition">
               View Live Store
             </button>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* STAT CARD 1: REVENUE */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
            <h2 className="text-3xl font-black mt-1">£{Number(data.revenue).toFixed(2)}</h2>
          </div>
          <div className="bg-green-100 p-3 rounded-xl">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* STAT CARD 2: ORDERS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
            <h2 className="text-3xl font-black mt-1">{data.totalOrders}</h2>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* STAT CARD 3: PRODUCTS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Active Products</p>
            <h2 className="text-3xl font-black mt-1">{data.activeProducts}</h2>
          </div>
          <div className="bg-orange-100 p-3 rounded-xl">
            <Package className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MAIN COLUMN (Chart & Recent Orders) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* CHART SECTION */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-gray-400" />
              Sales Overview (Last 7 Days)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `£${value}`} />
                  <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="total" fill="#ea580c" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECENT ORDERS TABLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-lg font-bold">Recent Orders</h3>
              <Link href="/admin/orders" className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recentOrders.length > 0 ? (
                    data.recentOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900">
                          #{order.order_number || order.id.slice(0,6)}
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                             order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                           }`}>
                             {order.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">£{Number(order.total_amount).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">No orders yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* SIDEBAR COLUMN (Quick Actions & Low Stock) */}
        <div className="space-y-8">
          
          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/orders" className="block">
              <div className="bg-black text-white p-4 rounded-xl shadow-lg hover:bg-gray-800 transition cursor-pointer text-center">
                <Truck className="mx-auto mb-2" size={24} />
                <span className="font-bold text-sm">Manage Orders</span>
              </div>
            </Link>
            <Link href="/admin/products" className="block">
              <div className="bg-white border border-gray-200 text-black p-4 rounded-xl shadow-sm hover:bg-gray-50 transition cursor-pointer text-center">
                <Package className="mx-auto mb-2" size={24} />
                <span className="font-bold text-sm">Manage Stock</span>
              </div>
            </Link>
          </div>

          {/* LOW STOCK ALERTS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-red-50">
              <h3 className="text-red-800 font-bold flex items-center gap-2">
                <AlertTriangle size={18} />
                Low Stock Alerts
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {data.lowStockItems.length > 0 ? (
                data.lowStockItems.map((item: any) => (
                  <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">ID: {item.id.slice(0,6)}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      item.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.stock} left
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">
                  All stock levels are healthy! 
                </div>
              )}
            </div>
            {data.lowStockItems.length > 0 && (
              <div className="p-3 bg-gray-50 text-center">
                <Link href="/admin/products" className="text-xs font-bold text-gray-500 hover:text-black">
                  Fix in Products Page →
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}