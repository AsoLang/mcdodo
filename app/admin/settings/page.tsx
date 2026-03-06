// Path: app/admin/settings/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, LogOut } from 'lucide-react';

interface BannerItem {
  icon: 'truck' | 'rocket' | 'basket';
  text: string;
}

interface BannerSettings {
  enabled: boolean;
  color: string;
  items: BannerItem[];
}

const ICON_LABELS = { truck: 'Truck', rocket: 'Rocket', basket: 'Basket' };

export default function SettingsPage() {
  const [settings, setSettings] = useState<BannerSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => { if (r.status === 401) router.push('/admin'); return r.json(); })
      .then(data => data && setSettings(data));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateText = (index: number, text: string) => {
    if (!settings) return;
    const items = [...settings.items];
    items[index] = { ...items[index], text };
    setSettings({ ...settings, items });
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Site Settings</h1>
              <p className="text-sm text-gray-500">Manage promotional banner</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold rounded-lg text-sm hover:bg-gray-800">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Promo Banner Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Promo Banner</h2>
              <p className="text-sm text-gray-500 mt-0.5">Shown under the navigation bar</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.enabled ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Banner Colour */}
          <div className="mb-6">
            <label htmlFor="banner-color" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Banner colour
            </label>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg border border-gray-200 flex-shrink-0" style={{ backgroundColor: settings.color || '#f97316' }} />
              <input
                id="banner-color"
                name="bannerColor"
                type="text"
                value={settings.color || ''}
                onChange={e => {
                  let val = e.target.value;
                  if (val && !val.startsWith('#')) val = '#' + val;
                  setSettings({ ...settings, color: val });
                }}
                placeholder="#f97316"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Preview */}
          <div className={`rounded-lg mb-6 overflow-hidden transition-opacity ${settings.enabled ? 'opacity-100' : 'opacity-40'}`}>
            <div className="px-4 py-2.5 flex items-center justify-center gap-6 flex-wrap" style={{ backgroundColor: settings.color || '#f97316' }}>
              {settings.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white text-sm font-semibold whitespace-nowrap">
                  <img
                    src={item.icon === 'truck' ? '/media/svg/truck.svg' : item.icon === 'rocket' ? '/media/svg/rcoket.svg' : '/media/svg/basketicon.svg'}
                    alt={item.icon}
                    width={20}
                    height={20}
                    className="brightness-0 invert"
                  />
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Text Inputs */}
          <div className="space-y-4">
            {settings.items.map((item, i) => (
              <div key={i}>
                <label htmlFor={`banner-text-${i}`} className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {ICON_LABELS[item.icon]} text
                </label>
                <input
                  id={`banner-text-${i}`}
                  name={`bannerText${i}`}
                  type="text"
                  value={item.text}
                  onChange={e => updateText(i, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            ))}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition ${saved ? 'bg-green-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'} disabled:opacity-50`}
          >
            <Save size={16} />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
