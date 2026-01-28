// Path: app/admin/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, DollarSign, Users, BarChart3, ArrowRight, LogOut, ChevronDown, ChevronUp, ExternalLink, Globe, Eye
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const FILTERS = [
  { label: '24H', value: '1d' }, { label: '7D', value: '7d' }, 
  { label: '30D', value: '1m' }, { label: '3M', value: '3m' }, 
  { label: 'YTD', value: '1y' }, { label: 'All', value: 'all' },
];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [countries, setCountries] = useState<{ uk_visits: number; other_visits: number }>({ uk_visits: 0, other_visits: 0 });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchData(range);
  }, [range]);

  useEffect(() => {
    fetchCountries(range);
  }, [range]);

  const fetchData = async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?range=${selectedRange}`);
      if (res.status === 401) { router.push('/admin'); return; }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally { setLoading(false); }
  };

  const fetchCountries = async (selectedRange: string) => {
    try {
      const res = await fetch(`/api/admin/visitor-countries?range=${selectedRange}`);
      if (res.ok) {
        const json = await res.json();
        setCountries({
          uk_visits: Number(json.uk_visits || 0),
          other_visits: Number(json.other_visits || 0),
        });
      }
    } catch (err) {
      console.error('Failed to fetch countries:', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  if (loading && !data) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, Admin</p>
          </div>
          <div className="flex gap-3">
             <Link href="/" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 text-sm">View Store</Link>
             <button onClick={() => { fetchData(range); fetchCountries(range); }} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 text-sm">Refresh</button>
             <button onClick={handleLogout} className="px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 text-sm flex items-center gap-2"><LogOut size={16} /> Logout</button>
          </div>
        </div>

        <div className="flex gap-4 border-b border-gray-200 pb-1 mb-8 overflow-x-auto">
          <button className="px-4 py-2 text-orange-600 border-b-2 border-orange-600 font-bold text-sm">Overview</button>
          <Link href="/admin/orders" className="px-4 py-2 text-gray-500 hover:text-gray-900 font-medium text-sm">Orders</Link>
          <Link href="/admin/products" className="px-4 py-2 text-gray-500 hover:text-gray-900 font-medium text-sm">Products</Link>
          <Link href="/admin/customers" className="px-4 py-2 text-gray-500 hover:text-gray-900 font-medium text-sm">Customers</Link>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setRange(f.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                range === f.value ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard title="Total Revenue" value={`£${Number(data.revenue).toFixed(2)}`} icon={<DollarSign size={20} />} color="orange" />
          <KpiCard title="Orders" value={data.totalOrders} icon={<ShoppingBag size={20} />} color="blue" />
          <KpiCard title="Visitors" value={`${countries.uk_visits} + ${countries.other_visits}`} icon={<BarChart3 size={20} />} color="purple" />
          <KpiCard title="Customers" value={data.totalCustomers} icon={<Users size={20} />} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px]">
            <h3 className="font-bold text-gray-900 mb-6">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={data.salesData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#9ca3af', fontSize:11}} minTickGap={30}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:'#9ca3af', fontSize:11}} tickFormatter={(v)=>`£${v}`}/>
                <Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}} itemStyle={{fontSize:'12px', fontWeight:'bold'}} />
                <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-[400px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Recent Orders</h3>
              <Link href="/admin/orders" className="text-xs font-bold text-orange-600 flex items-center gap-1">View All <ArrowRight size={12}/></Link>
            </div>
            <div className="overflow-y-auto flex-1">
              {data.recentOrders.length > 0 ? data.recentOrders.map((o: any) => (
                <div key={o.id} className="border-b border-gray-50">
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                    className="w-full p-4 hover:bg-gray-50 flex justify-between items-center text-left transition"
                  >
                    <div>
                      <div className="font-bold text-sm">#{o.order_number}</div>
                      <div className="text-xs text-gray-500">{o.customer_name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-sm">£{Number(o.total).toFixed(2)}</div>
                        <span
                          className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                            (o.fulfillment_status || o.status) === 'shipped'
                              ? 'bg-green-100 text-green-700'
                              : (o.fulfillment_status || o.status) === 'delivered'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {o.fulfillment_status || o.status}
                        </span>
                      </div>
                      {expandedOrder === o.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>
                  
                  {expandedOrder === o.id && (
                    <div className="px-4 pb-4 bg-gray-50 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium">{o.customer_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span className="font-medium">
                          {new Date(o.created_at).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      {(o.shipping_address_line1 || o.shipping_city) && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="text-gray-500 mb-1">Shipping:</div>
                          <div className="font-medium">
                            {o.shipping_address_line1 && <div>{o.shipping_address_line1}</div>}
                            {o.shipping_address_line2 && <div>{o.shipping_address_line2}</div>}
                            {o.shipping_city && o.shipping_postal_code && (
                              <div>{o.shipping_city}, {o.shipping_postal_code}</div>
                            )}
                            {o.shipping_country && <div>{o.shipping_country}</div>}
                          </div>
                        </div>
                      )}
                      {o.items && Array.isArray(o.items) && o.items.length > 0 && (
                        <div className="pt-2 border-t border-gray-200">
                          <div className="text-gray-500 mb-1">Items:</div>
                          {o.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between py-1">
                              <span>
                                {item.name} x{item.quantity}
                                {(item.color || item.size) && (
                                  <span className="text-gray-500"> ({[item.color, item.size].filter(Boolean).join(' · ')})</span>
                                )}
                              </span>
                              <span className="font-medium">£{item.price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <Link 
                        href={`/admin/orders`}
                        className="mt-3 flex items-center justify-center gap-1 text-orange-600 hover:text-orange-700 font-bold"
                      >
                        View Full Order <ExternalLink size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              )) : <div className="p-8 text-center text-gray-400 text-sm">No recent orders</div>}
            </div>
          </div>
        </div>

        {/* Visitor Trend Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <Eye size={20} className="text-purple-600" />
            <h3 className="font-bold text-gray-900">Visitor Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={data.visitorData}>
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#9ca3af', fontSize:11}} minTickGap={30}/>
              <YAxis axisLine={false} tickLine={false} tick={{fill:'#9ca3af', fontSize:11}}/>
              <Tooltip 
                contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}} 
                itemStyle={{fontSize:'12px', fontWeight:'bold'}}
                formatter={(value: any, name?: string) => {
                  if (name === 'visitors') return [value, 'Visitors'];
                  if (name === 'pageViews') return [value, 'Page Views'];
                  return [value, name || ''];
                }}
              />
              <Area type="monotone" dataKey="visitors" stroke="#9333ea" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" name="Visitors" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* UK vs Other Visitors */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Globe size={20} className="text-orange-600" />
            <h3 className="font-bold text-gray-900">Visitors</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl">{getCountryFlag('United Kingdom')}</div>
              <div className="flex-1">
                <div className="font-bold text-sm text-gray-900">United Kingdom</div>
                <div className="text-xs text-gray-500">{countries.uk_visits} visits</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl">🌍</div>
              <div className="flex-1">
                <div className="font-bold text-sm text-gray-900">Other Countries</div>
                <div className="text-xs text-gray-500">{countries.other_visits} visits</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, color }: any) {
  const colors: any = {
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function getCountryFlag(country: string): string {
  const flags: any = {
    'United Kingdom': '🇬🇧',
    'United States': '🇺🇸',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Netherlands': '🇳🇱',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'India': '🇮🇳',
    'China': '🇨🇳',
    'Japan': '🇯🇵',
    'Ireland': '🇮🇪',
    'Singapore': '🇸🇬',
    'Malaysia': '🇲🇾',
    'Unknown': '🌍'
  };
  return flags[country] || '🌍';
}
