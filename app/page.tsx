// Path: app/page.tsx

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