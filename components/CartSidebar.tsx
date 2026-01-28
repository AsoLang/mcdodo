// Path: components/CartSidebar.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, Truck, Tag, Check, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import confetti from 'canvas-confetti';

export default function CartSidebar() {
  const { items, itemCount, total, isOpen, closeCart, updateQuantity, removeItem } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // Discount state
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, amount: number} | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);

  const FREE_SHIPPING_THRESHOLD = 20.00;
  const SHIPPING_COST = 3.99;
  
  const isFreeShipping = total >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : SHIPPING_COST;
  
  // Calculate discount
  const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
  const subtotalAfterDiscount = Math.max(0, total - discountAmount);
  const finalTotal = subtotalAfterDiscount + shippingCost;
  
  const remainingForFree = FREE_SHIPPING_THRESHOLD - total;
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);
  const prevFreeShipping = useRef<boolean | null>(null);

  // Confetti function
  const fireConfetti = () => {
    const duration = 1200;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 320, ticks: 50, zIndex: 10000 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 35 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ff6b35', '#f7931e', '#10b981', '#3b82f6', '#8b5cf6']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ff6b35', '#f7931e', '#10b981', '#3b82f6', '#8b5cf6']
      });
    }, 180);
  };

  useEffect(() => {
    if (prevFreeShipping.current === null) {
      prevFreeShipping.current = isFreeShipping;
      return;
    }

    if (!prevFreeShipping.current && isFreeShipping) {
      setTimeout(() => fireConfetti(), 150);
    }

    prevFreeShipping.current = isFreeShipping;
  }, [isFreeShipping]);

  const validateDiscount = async () => {
    if (!discountCode.trim()) return;
    
    setIsValidating(true);
    setDiscountError('');
    
    try {
      const res = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, subtotal: total })
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setAppliedDiscount({ 
          code: discountCode.toUpperCase(), 
          amount: data.discountAmount 
        });
        setDiscountError('');
        setDiscountOpen(false);
        
        // Fire confetti on success!
        setTimeout(() => fireConfetti(), 200);
      } else {
        setDiscountError(data.error || 'Invalid code');
        setAppliedDiscount(null);
      }
    } catch (error) {
      setDiscountError('Failed to validate code');
      setAppliedDiscount(null);
    } finally {
      setIsValidating(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
    setDiscountOpen(true);
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items,
          shippingCost,
          discountCode: appliedDiscount?.code || null,
        }),
      });

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
        setIsCheckingOut(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to proceed to checkout');
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <ShoppingBag className="text-orange-600" size={22} />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Cart ({itemCount})
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-white/80 rounded-full transition"
              >
                <X size={22} className="text-gray-600" />
              </button>
            </div>

            {/* Free Shipping Bar */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white border-b border-gray-100">
              <div className="mb-2 text-base font-medium">
                {isFreeShipping ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Truck size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span>Free Shipping! 🎉</span>
                  </div>
                ) : (
                  <div className="text-gray-700">
                    Add <span className="text-orange-600 font-bold">£{remainingForFree.toFixed(2)}</span> for Free Shipping
                  </div>
                )}
              </div>
              
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    isFreeShipping ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag size={70} className="sm:w-20 sm:h-20 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Add some products to get started!</p>
                  <button
                    onClick={closeCart}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        <Link href={`/shop/p/${item.productUrl}`} onClick={closeCart}>
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 cursor-pointer hover:opacity-80 transition">
                            <Image
                              src={item.image || '/placeholder.jpg'}
                              alt={item.title}
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link href={`/shop/p/${item.productUrl}`} onClick={closeCart}>
                            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 hover:text-orange-600 transition cursor-pointer">
                              {item.title}
                            </h3>
                          </Link>
                          
                          <div className="flex gap-2 mb-2 text-xs sm:text-sm">
                            {item.color && (
                              <span className="bg-white px-2 py-1 rounded border border-gray-200 text-gray-900 font-medium">
                                {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className="bg-white px-2 py-1 rounded border border-gray-200 text-gray-900 font-medium">
                                {item.size}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            {item.onSale ? (
                              <>
                                <span className="font-bold text-orange-500 text-base">
                                  £{item.salePrice.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-400 line-through">
                                  £{item.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-900 text-base">
                                £{item.price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-l-lg transition"
                              >
                                <Minus size={15} className="text-gray-600" />
                              </button>
                              <span className="px-2.5 sm:px-3 font-semibold text-gray-900 text-sm min-w-[2ch] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-r-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus size={15} className="text-gray-600" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>

                          {item.quantity >= item.stock && item.stock > 0 && (
                            <p className="text-xs text-orange-600 mt-2">
                              Maximum stock reached
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                
                {/* Discount Code Section */}
                <div className="mb-3 sm:mb-4">
                  {appliedDiscount ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Check size={17} className="text-green-600" />
                        <span className="text-sm font-semibold text-green-900">
                          Code <span className="font-mono">{appliedDiscount.code}</span> applied! 🎉
                        </span>
                      </div>
                      <button
                        onClick={removeDiscount}
                        className="text-green-700 hover:text-green-900 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </motion.div>
                  ) : (
                    <div>
                      <button
                        onClick={() => setDiscountOpen(!discountOpen)}
                        className="sm:hidden w-full flex items-center justify-between text-sm font-medium text-gray-700 mb-2 hover:text-gray-900 transition"
                      >
                        <div className="flex items-center gap-2">
                          <Tag size={15} /> Have a discount code?
                        </div>
                        {discountOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      <label className="hidden sm:block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Tag size={15} /> Have a discount code?
                        </div>
                      </label>
                      
                      <div className="sm:hidden">
                        <AnimatePresence>
                          {discountOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={discountCode}
                                  onChange={(e) => {
                                    setDiscountCode(e.target.value.toUpperCase());
                                    setDiscountError('');
                                  }}
                                  onKeyPress={(e) => e.key === 'Enter' && validateDiscount()}
                                  placeholder="ENTER CODE"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-base font-mono uppercase text-gray-900 placeholder:text-gray-400"
                                />
                                <button
                                  onClick={validateDiscount}
                                  disabled={!discountCode.trim() || isValidating}
                                  className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 text-sm"
                                >
                                  {isValidating ? '...' : 'Apply'}
                                </button>
                              </div>
                              {discountError && (
                                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                                  <AlertCircle size={14} />
                                  <span>{discountError}</span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="hidden sm:block">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => {
                              setDiscountCode(e.target.value.toUpperCase());
                              setDiscountError('');
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && validateDiscount()}
                            placeholder="ENTER CODE"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-mono uppercase text-gray-900 placeholder:text-gray-400"
                          />
                          <button
                            onClick={validateDiscount}
                            disabled={!discountCode.trim() || isValidating}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 text-sm"
                          >
                            {isValidating ? '...' : 'Apply'}
                          </button>
                        </div>
                        {discountError && (
                          <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                            <AlertCircle size={14} />
                            <span>{discountError}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-2 text-gray-600 text-sm">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-bold text-gray-900">
                    £{total.toFixed(2)}
                  </span>
                </div>

                {appliedDiscount && (
                  <div className="flex justify-between items-center mb-2 text-green-600 text-sm">
                    <span className="font-medium">Discount ({appliedDiscount.code})</span>
                    <span className="font-bold">
                      -£{discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center mb-4 text-gray-600 text-sm">
                  <span className="font-medium">Shipping</span>
                  {isFreeShipping ? (
                    <span className="font-bold text-green-600">Free</span>
                  ) : (
                    <span className="font-bold text-gray-900">£{SHIPPING_COST}</span>
                  )}
                </div>

                <div className="h-px bg-gray-200 w-full mb-4"></div>

                <div className="flex justify-between items-center mb-5 sm:mb-6">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-black text-orange-600">
                    £{finalTotal.toFixed(2)}
                  </span>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:from-orange-600 hover:to-orange-700 transition shadow-lg mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                </button>

                <button
                  onClick={closeCart}
                  className="w-full bg-white text-orange-600 py-3 rounded-xl font-semibold border-2 border-orange-200 hover:bg-orange-50 transition"
                >
                  Continue Shopping
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Taxes calculated at checkout
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
