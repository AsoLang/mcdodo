// Path: app/admin/campaigns/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Mail, TrendingUp, MousePointerClick, XCircle, Send } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns');
      if (res.status === 401) { router.push('/admin'); return; }
      const data = await res.json();
      setCampaigns(data);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  const calculateRate = (count: number, total: number) => {
    if (total === 0) return '0%';
    return ((count / total) * 100).toFixed(1) + '%';
  };

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
            <h1 className="text-3xl font-black text-gray-900">Email Campaigns</h1>
            <p className="text-sm text-gray-500">{campaigns.length} total campaigns</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/customers/generate"
              className="px-4 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 text-sm flex items-center gap-2"
            >
              <Send size={16} /> New Campaign
            </Link>
            <Link href="/admin/dashboard" className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 text-sm">
              Back to Dashboard
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 text-sm flex items-center gap-2">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Mail size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-6">Start by creating your first email campaign</p>
            <Link
              href="/admin/customers/generate"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600"
            >
              <Send size={18} /> Create Campaign
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{campaign.campaign_name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{campaign.subject}</p>
                    <p className="text-xs text-gray-400">
                      Sent {new Date(campaign.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                    <StatCard
                      icon={<Send size={16} />}
                      label="Sent"
                      value={campaign.sent_count}
                      color="blue"
                    />
                    <StatCard
                      icon={<Mail size={16} />}
                      label="Delivered"
                      value={campaign.delivered_count}
                      percentage={calculateRate(campaign.delivered_count, campaign.sent_count)}
                      color="green"
                    />
                    <StatCard
                      icon={<TrendingUp size={16} />}
                      label="Opened"
                      value={campaign.opened_count}
                      percentage={calculateRate(campaign.opened_count, campaign.delivered_count)}
                      color="orange"
                    />
                    <StatCard
                      icon={<MousePointerClick size={16} />}
                      label="Clicked"
                      value={campaign.clicked_count}
                      percentage={calculateRate(campaign.clicked_count, campaign.opened_count)}
                      color="purple"
                    />
                    <StatCard
                      icon={<XCircle size={16} />}
                      label="Bounced"
                      value={campaign.bounced_count}
                      percentage={calculateRate(campaign.bounced_count, campaign.sent_count)}
                      color="red"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, percentage, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className={`${colors[color]} rounded-xl p-3 text-center`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
      {percentage && <div className="text-xs font-medium mt-1">{percentage}</div>}
    </div>
  );
}