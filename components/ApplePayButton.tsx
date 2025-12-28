// Path: components/ApplePayButton.tsx

'use client';

import { useState, useEffect } from 'react';

interface ApplePayButtonProps {
  productId: string;
  productTitle: string;
  price: number;
  salePrice?: number;
  onSale: boolean;
  image: string;
  productUrl: string;
  selectedColor?: string;
  selectedSize?: string;
}

export default function ApplePayButton({
  productId,
  productTitle,
  price,
  salePrice,
  onSale,
  image,
  productUrl,
  selectedColor,
  selectedSize
}: ApplePayButtonProps) {
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

  const handleApplePay = async () => {
    setIsProcessing(true);

    try {
      const finalPrice = onSale && salePrice ? salePrice : price;

      const res = await fetch('/api/apple-pay-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          title: productTitle,
          price: finalPrice,
          image,
          productUrl,
          color: selectedColor,
          size: selectedSize,
          quantity: 1
        })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to process Apple Pay');
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
      disabled={isProcessing}
      className="apple-pay-button apple-pay-button-black w-full h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
      // @ts-ignore - Apple Pay button styling not recognized by TypeScript
      style={{
        WebkitAppearance: '-apple-pay-button',
      }}
      aria-label="Buy with Apple Pay"
    >
      {/* Fallback for browsers that don't support Apple Pay button */}
      <span className="apple-pay-fallback">
        {isProcessing ? 'Processing...' : 'Buy with Apple Pay'}
      </span>
    </button>
  );
}