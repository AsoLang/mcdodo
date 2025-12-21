'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ---------- count up hook ---------- */
function useCountUp({
  to,
  durationMs = 700,
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

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, to, durationMs]);

  return useMemo(() => value.toFixed(decimals), [value, decimals]);
}

/* ---------- stat ---------- */
function Stat({
  value,
  suffix,
  subtitle,
  decimals,
  start,
}: {
  value: number;
  suffix: string;
  subtitle: string;
  decimals?: number;
  start: boolean;
}) {
  const n = useCountUp({ to: value, decimals: decimals ?? 0, start });

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-end gap-2">
        <div className="text-5xl font-extrabold text-gray-900 leading-none">{n}</div>
        <div className="pb-1 text-lg font-semibold text-gray-900">{suffix}</div>
      </div>
      <p className="mt-3 text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}

/* ---------- reveal ---------- */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPage() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true });

  /* ---------- JSON-LD SEO (allowed in client) ---------- */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Mcdodo UK',
    url: 'https://mcdodo.co.uk',
    description:
      'Mcdodo UK is a UK-based store offering Mcdodo fast charging cables, GaN chargers, power banks, audio accessories and device protection.',
    sameAs: [],
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto">
        {/* HERO */}
        <section className="mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
            About Mcdodo UK
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Mcdodo (UK) is based in the United Kingdom, bringing trusted Mcdodo fast charging
            accessories to customers nationwide.
          </p>
        </section>

        {/* STATS */}
        <section ref={statsRef} className="mb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat value={12} suffix="Years" subtitle="Fast charging innovation" start={statsInView} />
          <Stat value={106} suffix="Countries" subtitle="Global presence" start={statsInView} />
          <Stat value={100} suffix="Million+" subtitle="Products sold worldwide" start={statsInView} />
          <Stat value={4.5} suffix="Rating" subtitle="Customer reviews" decimals={1} start={statsInView} />
        </section>

        {/* ABOUT */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16 items-center">
          <div>
            <Reveal>
              <h2 className="text-3xl font-extrabold text-gray-900">About us</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-4 text-gray-700">
                Mcdodo is a global 3C digital brand specialising in fast charging technology,
                including USB-C cables, chargers, GaN power solutions and audio accessories.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 text-gray-700">
                In 2015, Mcdodo introduced the Auto Disconnect Cable, redefining charging safety
                by stopping power automatically once fully charged.
              </p>
            </Reveal>
          </div>

          <Image
            src="/about/about-1.jpg"
            alt="Mcdodo fast charging innovation"
            width={1200}
            height={800}
            className="rounded-2xl object-cover"
          />
        </section>

        {/* INNOVATION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16 items-center">
          <Image
            src="/about/about-2.jpg"
            alt="Mcdodo product innovation"
            width={1200}
            height={800}
            className="rounded-2xl object-cover"
          />

          <div>
            <Reveal>
              <h2 className="text-3xl font-extrabold text-gray-900">Innovation</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-4 text-gray-700">
                From fast chargers to compact GaN technology, Mcdodo products are built
                around quality, safety, efficiency, ease of use and unique design.
              </p>
            </Reveal>
          </div>
        </section>

        {/* GLOBAL */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16 items-center">
          <div>
            <Reveal>
              <h2 className="text-3xl font-extrabold text-gray-900">Global presence</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-4 text-gray-700">
                Mcdodo products are exported worldwide across Europe, America and Asia,
                supporting millions of users every day.
              </p>
            </Reveal>
          </div>

          <Image
            src="/about/about-3.jpg"
            alt="Mcdodo global exhibition"
            width={1200}
            height={800}
            className="rounded-2xl object-cover"
          />
        </section>

        {/* FOOTER */}
        <footer className="flex justify-between text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Mcdodo UK</span>
          <div className="flex gap-4">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
