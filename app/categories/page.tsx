'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

const categories = [
  {
    name: 'USB-C Cables',
    image: '/categories/1.png',
    href: '/shop?category=usb-c-cables',
    description: 'Fast charging cables',
  },
  {
    name: 'Lightning Cables',
    image: '/categories/2.png',
    href: '/shop?category=lightning-cables',
    description: 'Apple-compatible cables',
  },
  {
    name: 'Power Adapters',
    image: '/categories/3.png',
    href: '/shop?category=power-adapters',
    description: 'Wall and car charging',
  },
  {
    name: 'Cable Accessories',
    image: '/categories/4.png',
    href: '/shop?category=accessories',
    description: 'Converters and organizers',
  },
  {
    name: 'Audio Accessories',
    image: '/categories/5.png',
    href: '/shop?category=audio',
    description: 'Earbuds and audio gear',
  },
  {
    name: 'Protection',
    image: '/categories/6.png',
    href: '/shop?category=protection',
    description: 'Cases and protectors',
  },
];

function useCountUp({
  to,
  durationMs = 650,
  decimals = 0,
  start = false,
}: {
  to: number;
  durationMs?: number;
  decimals?: number;
  start?: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    let raf = 0;
    const startTime = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const next = from + (to - from) * eased;

      setValue(next);

      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, to, durationMs]);

  const formatted = useMemo(() => {
    return value.toFixed(decimals);
  }, [value, decimals]);

  return formatted;
}

function Stat({
  value,
  decimals,
  suffix,
  title,
  subtitle,
  start,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  title: string;
  subtitle: string;
  start: boolean;
}) {
  const n = useCountUp({ to: value, durationMs: 700, decimals: decimals ?? 0, start });

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-end gap-2">
        <div className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-none">
          {n}
        </div>
        <div className="pb-1 text-lg md:text-xl font-semibold text-gray-900">
          {suffix ?? title}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={start ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mt-3"
      >
        <div className="text-sm font-semibold text-gray-900">{subtitle}</div>
      </motion.div>
    </div>
  );
}

export default function CategoriesPage() {
  const statsRef = useRef<HTMLDivElement | null>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-20% 0px -20% 0px' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
            Categories
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          </div>

          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Friendly innovation for your everyday digital life
          </h1>

          <p className="mt-3 text-base md:text-lg text-gray-600 max-w-2xl">
            Choose a category below to find the right cable, charger, audio accessory, or protection for your device.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-white font-semibold hover:bg-gray-800 transition"
            >
              Shop All
            </Link>
            <Link
              href="/shop?featured=true"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-gray-900 font-semibold hover:bg-gray-50 transition"
            >
              Best Sellers
            </Link>
          </div>
        </div>

        {/* Brand stats section */}
        <div
          ref={statsRef}
          className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
        >
          <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-2xl md:text-3xl font-extrabold text-gray-900"
            >
              Built for modern charging
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.06 }}
              className="mt-3 text-gray-600 leading-relaxed"
            >
              From fast-charging cables to compact GaN chargers and everyday essentials, Mcdodo focuses on clean design,
              durable materials, and smart details that make daily use feel better.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.12 }}
              className="mt-6 flex flex-wrap gap-2"
            >
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-800">
                Fast Charging
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-800">
                Durable Builds
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-800">
                Modern Design
              </span>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Stat
              value={12}
              title="Years"
              suffix="Years"
              subtitle="Technology for 12 years"
              start={statsInView}
            />
            <Stat
              value={106}
              title="Countries"
              suffix="Countries"
              subtitle="Available in 106 countries"
              start={statsInView}
            />
            <Stat
              value={100}
              title="Million+"
              suffix="Million+"
              subtitle="100 million+ sold worldwide"
              start={statsInView}
            />
            <Stat
              value={4.5}
              decimals={1}
              title="Reviews"
              suffix="Reviews"
              subtitle="Rating based on customer reviews"
              start={statsInView}
            />
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c, index) => (
            <Link key={c.name} href={c.href} className="group">
              <div className="rounded-2xl p-6 aspect-square flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.04] hover:shadow-xl bg-gradient-to-br from-[#FF5A00]/62 via-[#FF6A00]/52 to-[#FF8A00]/42">
                <Image
                  src={c.image}
                  alt={c.name}
                  width={104}
                  height={104}
                  className="mb-3 h-26 w-26 object-contain transition-transform duration-300 group-hover:scale-130"
                  priority={index < 2}
                />
                <div className="text-sm font-semibold text-center leading-tight text-white">
                  {c.name}
                </div>
              </div>

              <p className="text-xs text-gray-600 text-center mt-2 group-hover:text-gray-900 transition">
                {c.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl bg-white border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Not sure which one fits?</h2>
            <p className="mt-1 text-sm text-gray-600">
              Browse the full shop and use filters to find the perfect match.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-5 py-3 text-white font-semibold hover:bg-orange-700 transition"
            >
              Go to Shop
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-gray-900 font-semibold hover:bg-gray-50 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <div>© {new Date().getFullYear()} Mcdodo UK</div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-gray-900 transition">
              Home
            </Link>
            <Link href="/shop" className="hover:text-gray-900 transition">
              Shop
            </Link>
            <Link href="/contact" className="hover:text-gray-900 transition">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
