// Path: components/TrustBadges.tsx

'use client';

import { motion } from 'framer-motion';
import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react';

const badges = [
  {
    icon: Truck,
    title: 'Fast Shipping',
    description: 'Quick delivery on all orders'
  },
  {
    icon: Shield,
    title: 'UK Warehouse',
    description: 'Stock held locally in the UK'
  },
  {
    icon: RotateCcw,
    title: '30-Day Returns',
    description: 'Easy returns policy'
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Always here to help'
  },
];

export default function TrustBadges() {
  return (
    <section className="py-12 bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <badge.icon className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{badge.title}</h3>
              <p className="text-sm text-gray-600">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}