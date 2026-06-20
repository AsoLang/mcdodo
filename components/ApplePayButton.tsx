// Path: components/ApplePayButton.tsx

'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

interface ApplePayButtonProps {
  productId: string;
  variantId: string;
  productTitle: string;
  price: number;
  salePrice?: number;
  onSale: boolean;
  image: string;
  productUrl: string;
  selectedColor?: string;
  selectedSize?: string;
  quantity?: number;
  stock?: number;
  disabled?: boolean;
}

export default function ApplePayButton({
  productId,
  variantId,
  productTitle,
  price,
  salePrice,
  onSale,
  image,
  productUrl,
  selectedColor,
  selectedSize,
  quantity = 1,
  stock = quantity,
  disabled = false
}: ApplePayButtonProps) {
  const { addItem, updateItemStock } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const resetProcessing = () => setIsProcessing(false);
    window.addEventListener('pageshow', resetProcessing);
    document.addEventListener('visibilitychange', resetProcessing);
    return () => {
      window.removeEventListener('pageshow', resetProcessing);
      document.removeEventListener('visibilitychange', resetProcessing);
    };
  }, []);

  const handleApplePay = async () => {
    if (disabled) return;
    
    setIsProcessing(true);

    try {
      for (let i = 0; i < quantity; i++) {
        addItem({
          id: variantId,
          productId,
          productUrl,
          title: productTitle,
          color: selectedColor,
          size: selectedSize,
          price,
          salePrice: salePrice ?? price,
          onSale,
          image,
          stock,
        });
      }

      const res = await fetch('/api/apple-pay-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          quantity
        })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.code === 'STOCK_CHANGED') {
        updateItemStock(variantId, Number(data.available || 0));
        alert(data.error || 'This item is no longer available in that quantity.');
        setIsProcessing(false);
      } else {
        alert(data.error || 'Failed to process Apple Pay');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Apple Pay error:', error);
      alert('Failed to process payment');
      setIsProcessing(false);
    }
  };

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <button
      onClick={handleApplePay}
      disabled={disabled || isProcessing}
      className="apple-pay-button apple-pay-button-black w-full h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        WebkitAppearance: '-apple-pay-button',
      }}
      aria-label="Buy with Apple Pay"
    >
      {/* Fallback for browsers that don't support Apple Pay button */}
      <span className="apple-pay-fallback">
        {isProcessing ? 'Processing...' : disabled ? 'Out of Stock' : 'Buy with Apple Pay'}
      </span>
    </button>
  );
}
