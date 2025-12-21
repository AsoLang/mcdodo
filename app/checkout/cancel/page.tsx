// Path: app/checkout/cancel/page.tsx

'use client';

import Link from 'next/link';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckoutCancel() {
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