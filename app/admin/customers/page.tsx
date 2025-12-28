// Path: app/admin/customers/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, User, Search, Mail, Phone, MapPin, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(customers);
    } else {
      const q = search.toLowerCase();
      setFiltered(customers.filter(c => 
        c.name?.toLowerCase().includes(q) || 
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      ));
    }
    setCurrentPage(1);
  }, [search, customers]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers');
      if (res.status === 401) { router.push('/admin'); return; }
      const data = await res.json();
      setCustomers(data);
      setFiltered(data);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedCustomers = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8 font-sans text-gray-900">
      
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500">{customers.length} total contacts</p>
          </div>
          <div className="flex gap-3">
             <Link
               href="/admin/customers/generate"
               className="px-4 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 text-sm flex items-center gap-2"
             >
               <Send size={16} /> Email Customers
             </Link>
             <Link href="/admin/dashboard" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 text-sm">
               Back to Dashboard
             </Link>
             <button onClick={handleLogout} className="px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 text-sm flex items-center gap-2">
               <LogOut size={16} /> Logout
             </button>
          </div>
        </div>

        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Search by name, email, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Orders</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Lifetime Value</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedCustomers.map((customer, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold flex-shrink-0">
                          {customer.name ? customer.name.charAt(0).toUpperCase() : <User size={18} />}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{customer.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail size={10} /> {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Phone size={10} /> {customer.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {customer.city ? (
                        <div className="text-sm text-gray-700 flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {customer.city}, {customer.country}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-medium">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                        {customer.total_orders}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-gray-900">£{Number(customer.total_spent).toFixed(2)}</span>
                    </td>
                    <td className="p-4 text-right text-sm text-gray-500">
                      {customer.last_order 
                        ? new Date(customer.last_order).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="text-gray-300">Never</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="px-4 py-2 font-medium text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}