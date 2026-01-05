// Path: components/ApplePayButton.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ApplePayButtonProps {
  productId: string;
  productTitle: string;
  price: number;
  salePrice: number;
  onSale: boolean;
  image: string;
  productUrl: string;
  selectedColor?: string;
  selectedSize?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    ApplePaySession?: any;
  }
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
  selectedSize,
  disabled = false,
}: ApplePayButtonProps) {
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.ApplePaySession &&
      window.ApplePaySession.canMakePayments()
    ) {
      setIsApplePayAvailable(true);
    }
  }, []);

  const handleApplePay = async () => {
    if (disabled || isProcessing) return;
    
    setIsProcessing(true);

    try {
      const finalPrice = onSale ? salePrice : price;
      const shippingCost = 0;

      const items = [{
        id: productId,
        title: productTitle,
        price: finalPrice,
        quantity: 1,
        onSale,
        salePrice,
        image,
        color: selectedColor,
        size: selectedSize,
      }];

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingCost }),
      });

      const data = await response.json();

      if (data.url) {
        router.push(data.url);
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Apple Pay error:', error);
      alert('Failed to process Apple Pay. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isApplePayAvailable) {
    return null;
  }

  return (
    <button
      onClick={handleApplePay}
      disabled={disabled || isProcessing}
      className={`w-full mt-3 py-3.5 rounded-xl font-bold text-base transition shadow-md flex items-center justify-center gap-2 ${
        disabled 
          ? 'bg-gray-300 cursor-not-allowed opacity-50 text-gray-500' 
          : 'bg-black hover:bg-gray-800 text-white'
      }`}
      style={{
        WebkitAppearance: 'none',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
      {isProcessing ? 'Processing...' : disabled ? 'Out of Stock' : 'Buy with Apple Pay'}
    </button>
  );
}