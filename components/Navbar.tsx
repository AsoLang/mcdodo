// Path: /components/Navbar.tsx

'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ShoppingCart, Search, Menu } from 'lucide-react';

export default function Navbar() {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.95)"]
  );
  const boxShadow = useTransform(
    scrollY,
    [0, 100],
    ["0px 0px 0px rgba(0,0,0,0)", "0px 4px 20px rgba(0,0,0,0.1)"]
  );

  return (
    <motion.nav style={{ backgroundColor, boxShadow }} className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/">
            <motion.div whileHover={{ scale: 1.05 }} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              MCDODO
            </motion.div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/shop" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Shop</Link>
            <Link href="/categories" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Categories</Link>
            <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">About</Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-gray-700 hover:text-gray-900">
              <Search size={24} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-gray-700 hover:text-gray-900 relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="md:hidden text-gray-700 hover:text-gray-900">
              <Menu size={24} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}