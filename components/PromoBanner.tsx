// Path: components/PromoBanner.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface BannerItem {
  icon: 'truck' | 'rocket' | 'basket';
  text: string;
}

interface BannerSettings {
  enabled: boolean;
  color: string;
  items: BannerItem[];
}

const iconMap = {
  truck: '/media/svg/truck.svg',
  rocket: '/media/svg/rcoket.svg',
  basket: '/media/svg/basketicon.svg',
};

export default function PromoBanner() {
  const [settings, setSettings] = useState<BannerSettings | null>(null);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    fetch('/api/promo-banner')
      .then(r => r.json())
      .then(data => data && setSettings(data));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setVisible(currentY < lastScrollY.current || currentY < 50);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!settings || !settings.enabled) return null;

  return (
    <>
      {/* Fixed banner positioned below the navbar (h-16 mobile / h-20 desktop) */}
      <div
        className={`fixed top-16 md:top-20 left-0 right-0 z-40 w-full text-white transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ backgroundColor: settings.color || '#f97316' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-6 md:gap-12 py-2.5 overflow-x-auto">
            {settings.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                <Image
                  src={iconMap[item.icon]}
                  alt={item.icon}
                  width={20}
                  height={20}
                  unoptimized
                  className="brightness-0 invert"
                />
                <span className="text-sm font-semibold">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Spacer so page content isn't hidden behind the fixed banner (~40px) */}
      <div className="h-10" />
    </>
  );
}
