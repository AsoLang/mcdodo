// Path: components/Hero.tsx

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block mb-4 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-semibold"
          >
            Premium Quality • Fast Charging
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Premium Charging
            <br />
            <span className="text-orange-600">Accessories</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 mb-8">
            Fast charging solutions for your lifestyle. High-quality cables, chargers, and accessories designed for durability and performance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/shop">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-10 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl shadow-xl transition flex items-center justify-center gap-2"
              >
                Shop Now
                <ArrowRight size={22} />
              </motion.button>
            </Link>

            <Link href="/categories" className="text-gray-700 hover:text-orange-600 font-medium transition-colors underline decoration-2 underline-offset-4">
              Browse Categories
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-gray-900">100K+</div>
              <div className="text-sm text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">4.9</div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300 rounded-full blur-3xl opacity-20 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-400 rounded-full blur-3xl opacity-20 -z-10"></div>
    </section>
  );
}