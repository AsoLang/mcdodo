// Path: components/Navbar.tsx

'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, Menu } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import SearchModal from './SearchModal';

interface SearchProduct {
  id: string;
  title: string;
  product_url: string;
  price: number;
  sale_price: number;
  on_sale: boolean;
  image: string;
  categories: string;
}

export default function Navbar() {
  const { scrollY } = useScroll();
  const { itemCount, openCart } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.98)"]
  );
  const boxShadow = useTransform(
    scrollY,
    [0, 100],
    ["0px 0px 0px rgba(0,0,0,0)", "0px 4px 20px rgba(0,0,0,0.1)"]
  );

  // Fetch products for search (only once)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('[Navbar] Fetching products for search...');
        const res = await fetch('/api/products/search');
        if (res.ok) {
          const data = await res.json();
          console.log('[Navbar] Loaded products for search:', data.length);
          setProducts(data);
        } else {
          console.error('[Navbar] Failed to fetch products:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('[Navbar] Failed to fetch products for search:', error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <>
      <motion.nav 
        style={{ backgroundColor, boxShadow }} 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/">
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                transition={{ duration: 0.2 }}
                className="flex items-center"
              >
                <Image 
                  src="/mcdodo-logo.png" 
                  alt="Mcdodo" 
                  width={140} 
                  height={45}
                  className="h-6 md:h-10 w-auto"
                  priority
                />
              </motion.div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/shop" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                Shop
              </Link>
              <Link href="/categories" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                Categories
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                About
              </Link>
            </div>
            
            <div className="flex items-center space-x-4 md:space-x-6">
              <motion.button
                onClick={() => setSearchOpen(true)}
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }} 
                transition={{ duration: 0.2 }}
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                <Search size={20} className="md:w-6 md:h-6" />
              </motion.button>
              
              <motion.button 
                onClick={openCart}
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }} 
                transition={{ duration: 0.2 }}
                className="text-gray-700 hover:text-orange-600 relative transition-colors"
              >
                <ShoppingCart size={20} className="md:w-6 md:h-6" />
                {itemCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center font-semibold text-[10px] md:text-xs"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </motion.span>
                )}
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }} 
                transition={{ duration: 0.2 }}
                className="md:hidden text-gray-700 hover:text-orange-600 transition-colors"
              >
                <Menu size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Search Modal */}
      <SearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        products={products}
      />
    </>
  );
}