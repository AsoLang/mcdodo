// Path: app/page.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mcdodo UK | USB-C Cables, Fast Chargers & Charging Accessories',
  description: 'Shop premium Mcdodo UK charging accessories - USB-C cables, fast chargers, wireless chargers and more. Free UK delivery on orders over £20. Trusted by 100,000+ customers.',
  alternates: { canonical: 'https://www.mcdodo.co.uk' },
};

import Hero from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid';
import FeaturedProducts from '@/components/FeaturedProducts';
import TrustBadges from '@/components/TrustBadges';
import WhyChooseUs from '@/components/WhyChooseUs';
import Newsletter from '@/components/Newsletter';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Hero />
      <TrustBadges />
      <CategoryGrid />
      <FeaturedProducts />
      <WhyChooseUs />
      <Newsletter />
    </main>
  );
}