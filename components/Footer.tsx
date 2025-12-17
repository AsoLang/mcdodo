// Path: /components/Footer.tsx

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Mail, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Image 
              src="/mcdodo-logo.png" 
              alt="Mcdodo UK" 
              width={140} 
              height={45}
              className="h-12 w-auto"
            />
            <p className="text-gray-600 text-sm leading-relaxed">
              Premium charging solutions with patented auto power-off technology. Fast, safe, and reliable.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              <a 
                href="mailto:info@mcdodo.co.uk" 
                className="w-10 h-10 bg-orange-100 hover:bg-orange-500 text-orange-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
              <a 
                href="https://instagram.com/mcdodo_uk" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-orange-100 hover:bg-orange-500 text-orange-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://facebook.com/mcdodouk" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-orange-100 hover:bg-orange-500 text-orange-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/shop" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-6">Customer Service</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/returns" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-orange-600 transition-colors text-sm">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Delivery */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-6">We Accept</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs font-medium text-gray-700">
                Visa
              </div>
              <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs font-medium text-gray-700">
                Mastercard
              </div>
              <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs font-medium text-gray-700">
                Maestro
              </div>
              <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs font-medium text-gray-700">
                Amex
              </div>
            </div>
            
            <h3 className="text-gray-900 font-bold text-sm mb-3">We Deliver To</h3>
            <p className="text-gray-600 text-sm">
              UK • FR • BE • DE • NL • IT • ES
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © {currentYear} Mcdodo UK. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Powered by</span>
              <span className="font-semibold text-orange-600">Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}