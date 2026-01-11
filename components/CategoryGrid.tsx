'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const categories = [
  {
    name: 'USB-C Cables',
    image: '/categories/1.png',
    link: '/shop?category=usb-c-cables',
    description: 'Fast charging USB-C cables',
  },
  {
    name: 'Lightning Cables',
    image: '/categories/2.png',
    link: '/shop?category=lightning-cables',
    description: 'Apple certified cables',
  },
  {
    name: 'Power Adapters',
    image: '/categories/3.png',
    link: '/shop?category=power-adapters',
    description: 'Wall & car chargers',
  },
  {
    name: 'Cable Accessories',
    image: '/categories/4.png',
    link: '/shop?category=accessories',
    description: 'Organizers & converters',
  },
  {
    name: 'Audio Accessories',
    image: '/categories/5.png',
    link: '/shop?category=audio',
    description: 'Earbuds & headphones',
  },
  {
    name: 'Protection',
    image: '/categories/6.png',
    link: '/shop?category=protection',
    description: 'Cases & screen protectors',
  },
];

export default function CategoryGrid() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find exactly what you need for all your devices
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={category.link}>
                <div className="group">
                  <div className="relative rounded-2xl p-6 aspect-square flex flex-col items-center justify-center transition-all duration-300 hover:scale-[1.04] hover:shadow-xl bg-gradient-to-br from-[#FF5A00]/70 via-[#FF6A00]/60 to-[#FF8A00]/50">
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={104}
                      height={104}
                      className="mb-3 h-26 w-26 object-contain transition-transform duration-300 group-hover:scale-125"
                      priority={index < 2}
                    />
                    <h3 className="text-sm font-bold text-center leading-tight text-white">
                      {category.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 text-center mt-3 leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}