// Path: app/checkout/cancel/page.tsx

'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';

function CancelContent() {
  const searchParams = useSearchParams();
  const { addItem } = useCart();

  useEffect(() => {
    // Check if we were sent back with the restore flag
    if (searchParams.get('restore_cart') === 'true') {
      // Retrieve the item we saved before leaving for Stripe
      const savedItem = localStorage.getItem('buynow_restore_item');
      
      if (savedItem) {
        try {
          const item = JSON.parse(savedItem);
          
          // Add the item back to the cart
          addItem(item);
          
          // Clear the backup so it doesn't duplicate if they refresh
          localStorage.removeItem('buynow_restore_item');
        } catch (e) {
          console.error('Failed to restore cart item:', e);
        }
      }
    }
  }, [searchParams, addItem]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Checkout Cancelled
        </h1>

        <p className="text-gray-600 mb-8">
          Your order was not completed. Your cart items are still saved if you'd like to try again.
        </p>

        <div className="space-y-3">
          {/* Note: Ensure '/shop' is where you want "Back to Cart" to go. 
              If you have a dedicated cart page, change this to href="/cart" */}
          <Link href="/shop" className="block">
            <button className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2">
              <ShoppingCart size={20} />
              Back to Cart
            </button>
          </Link>

          <Link href="/" className="block">
            <button className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition flex items-center justify-center gap-2">
              <ArrowLeft size={20} />
              Back to Home
            </button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Need help? Contact our support team.
        </p>
      </motion.div>
    </div>
  );
}

// We wrap the content in Suspense because useSearchParams() causes 
// Next.js to opt-out of static rendering for the whole page.
export default function CheckoutCancel() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <CancelContent />
    </Suspense>
  );
}