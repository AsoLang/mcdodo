// Path: app/success/page.tsx
'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();

  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');

  useEffect(() => {
    if (!sessionId) return;

    // Clear cart context
    clearCart();

    // Clear any persisted cart keys (safe + broad)
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const lower = k.toLowerCase();
        if (lower.includes('cart')) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Trigger listeners (some apps update badge on this)
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('cart:clear'));
    } catch {
      // ignore
    }
  }, [sessionId, clearCart]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const poll = async () => {
      setLookupState('loading');

      for (let i = 0; i < 10; i++) {
        try {
          const res = await fetch(`/api/orders/lookup?session_id=${encodeURIComponent(sessionId)}`, {
            cache: 'no-store',
          });

          if (res.ok) {
            const data = await res.json();
            if (!cancelled && data?.order_number) {
              setOrderNumber(Number(data.order_number));
              setLookupState('found');
              return;
            }
          }
        } catch {}

        await new Promise((r) => setTimeout(r, 800));
      }

      if (!cancelled) setLookupState('not_found');
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const orderLabel = useMemo(() => {
    if (orderNumber) return `Order #${orderNumber}`;
    if (!sessionId) return null;
    if (lookupState === 'loading') return 'Finding your order number...';
    if (lookupState === 'not_found') return 'Order received — we’re confirming it now.';
    return null;
  }, [orderNumber, sessionId, lookupState]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Successful!</h1>

        <p className="text-gray-600 mb-8">
          Thank you for your purchase. You'll receive an email confirmation shortly with your order
          details and tracking information.
        </p>

        <div className="bg-orange-50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-3 text-orange-700 mb-2">
            <Package size={24} />
            <span className="font-semibold">What's Next?</span>
          </div>
          <p className="text-sm text-orange-600">
            We'll process your order and ship it within 1-2 business days.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/shop" className="block">
            <button className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2">
              Continue Shopping
              <ArrowRight size={20} />
            </button>
          </Link>

          <Link href="/" className="block">
            <button className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition">
              Back to Home
            </button>
          </Link>
        </div>

        {orderLabel && <p className="text-xs text-gray-400 mt-6">{orderLabel}</p>}
      </motion.div>
    </div>
  );
}

// Wrap the content in a Suspense boundary
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}