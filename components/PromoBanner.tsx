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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState<'idle' | 'flipOut' | 'flipIn'>('idle');
  const nextIndexRef = useRef(0);
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

  // Mobile cycling: flip out → swap → flip in every 2.5s
  useEffect(() => {
    if (!settings?.items?.length || settings.items.length <= 1) return;
    const interval = setInterval(() => {
      nextIndexRef.current = (currentIndex + 1) % settings.items.length;
      setAnimState('flipOut');
    }, 2500);
    return () => clearInterval(interval);
  }, [settings, currentIndex]);

  const handleAnimationEnd = () => {
    if (animState === 'flipOut') {
      setCurrentIndex(nextIndexRef.current);
      setAnimState('flipIn');
    } else if (animState === 'flipIn') {
      setAnimState('idle');
    }
  };

  if (!settings || !settings.enabled) return null;

  const currentItem = settings.items[currentIndex];

  const flipStyle: React.CSSProperties =
    animState === 'flipOut'
      ? { animation: 'bannerFlipOut 0.3s ease-in forwards' }
      : animState === 'flipIn'
      ? { animation: 'bannerFlipIn 0.3s ease-out forwards' }
      : {};

  return (
    <>
      <style>{`
        @keyframes bannerFlipOut {
          from { transform: perspective(400px) rotateX(0deg); opacity: 1; }
          to   { transform: perspective(400px) rotateX(-90deg); opacity: 0; }
        }
        @keyframes bannerFlipIn {
          from { transform: perspective(400px) rotateX(90deg); opacity: 0; }
          to   { transform: perspective(400px) rotateX(0deg); opacity: 1; }
        }
      `}</style>

      {/* Fixed banner positioned below the navbar (h-16 mobile / h-20 desktop) */}
      <div
        className={`fixed top-16 md:top-20 left-0 right-0 z-40 w-full text-white transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ backgroundColor: settings.color || '#f97316' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5">

          {/* Mobile: single cycling item with flip animation */}
          <div className="flex md:hidden items-center justify-center" style={flipStyle} onAnimationEnd={handleAnimationEnd}>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Image
                src={iconMap[currentItem.icon]}
                alt={currentItem.icon}
                width={20}
                height={20}
                unoptimized
                className="brightness-0 invert"
              />
              <span className="text-sm font-semibold">{currentItem.text}</span>
            </div>
          </div>

          {/* Desktop: all items in a row */}
          <div className="hidden md:flex items-center justify-center gap-12">
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
