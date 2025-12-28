// Path: components/Navbar.tsx

'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Search, Menu, X, ShoppingBag, Package, Truck, Heart } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Fetch products for search
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products/search');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('[Navbar] Failed to fetch products:', error);
      }
    };
    fetchProducts();
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <motion.nav 
        style={{ backgroundColor, boxShadow }} 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" onClick={closeMobileMenu}>
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
            
            {/* Desktop Menu */}
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
            
            {/* Right Icons */}
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
              
              {/* Mobile Menu Button */}
              <motion.button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }} 
                transition={{ duration: 0.2 }}
                className="md:hidden text-gray-700 hover:text-orange-600 transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            
            {/* Menu Panel - Scrollable */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-16 right-0 bottom-0 w-80 bg-white shadow-2xl z-40 md:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                
                {/* Main Navigation */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Menu</h3>
                  <div className="space-y-1">
                    <Link 
                      href="/shop" 
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 text-base font-semibold text-gray-900 hover:text-orange-600 transition-colors py-2.5 px-3 rounded-lg hover:bg-orange-50"
                    >
                      <ShoppingBag size={18} />
                      Shop All Products
                    </Link>
                    <Link 
                      href="/categories" 
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 text-base font-semibold text-gray-900 hover:text-orange-600 transition-colors py-2.5 px-3 rounded-lg hover:bg-orange-50"
                    >
                      <Package size={18} />
                      Categories
                    </Link>
                    <Link 
                      href="/about" 
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 text-base font-semibold text-gray-900 hover:text-orange-600 transition-colors py-2.5 px-3 rounded-lg hover:bg-orange-50"
                    >
                      <Heart size={18} />
                      About Us
                    </Link>
                  </div>
                </div>

                {/* Customer Service */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer Service</h3>
                  <div className="space-y-1">
                    <Link 
                      href="/shipping" 
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-orange-600 transition-colors py-2 px-3 rounded-lg hover:bg-orange-50"
                    >
                      <Truck size={16} />
                      Shipping Information
                    </Link>
                    <Link 
                      href="/returns" 
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-orange-600 transition-colors py-2 px-3 rounded-lg hover:bg-orange-50"
                    >
                      <Package size={16} />
                      Returns & Refunds
                    </Link>
                  </div>
                </div>

                {/* Company Info */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Company</h3>
                  <div className="space-y-1">
                    <Link 
                      href="/about" 
                      onClick={closeMobileMenu}
                      className="block text-sm text-gray-600 hover:text-orange-600 transition-colors py-2 px-3 rounded-lg hover:bg-orange-50"
                    >
                      About Mcdodo UK
                    </Link>
                    <Link 
                      href="/contact" 
                      onClick={closeMobileMenu}
                      className="block text-sm text-gray-600 hover:text-orange-600 transition-colors py-2 px-3 rounded-lg hover:bg-orange-50"
                    >
                      Contact Us
                    </Link>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="border-t border-gray-200 pt-6 pb-4">
                  <p className="text-xs text-gray-500 text-center">
                    © 2026 Mcdodo UK. All rights reserved.
                  </p>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <SearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        products={products}
      />
    </>
  );
}