// Path: components/ApplePayButton.tsx

'use client';

import { useState, useEffect } from 'react';
import { Apple } from 'lucide-react';

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
      className="w-full bg-black text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Apple size={20} className="fill-current" />
      {isProcessing ? 'Processing...' : 'Buy with Apple Pay'}
    </button>
  );
}