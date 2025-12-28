// Path: app/api/validate-discount/route.ts

import { NextResponse } from 'next/server';

// Define your discount codes here
const DISCOUNT_CODES: Record<string, {
  type: 'percentage' | 'fixed',
  value: number,
  minPurchase?: number,
  active: boolean
}> = {
  'NEW10': {
    type: 'percentage',
    value: 10, // 10% off
    active: true
  },
  'WELCOME20': {
    type: 'percentage',
    value: 20, // 20% off
    minPurchase: 30, // Minimum £30 purchase
    active: true
  },
  'SAVE5': {
    type: 'fixed',
    value: 5, // £5 off
    active: true
  }
};

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ 
        valid: false, 
        error: 'No code provided' 
      }, { status: 400 });
    }

    const discountConfig = DISCOUNT_CODES[code.toUpperCase()];

    if (!discountConfig) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid discount code' 
      }, { status: 400 });
    }

    if (!discountConfig.active) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This code has expired' 
      }, { status: 400 });
    }

    if (discountConfig.minPurchase && subtotal < discountConfig.minPurchase) {
      return NextResponse.json({ 
        valid: false, 
        error: `Minimum purchase of £${discountConfig.minPurchase} required` 
      }, { status: 400 });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountConfig.type === 'percentage') {
      discountAmount = (subtotal * discountConfig.value) / 100;
    } else {
      discountAmount = discountConfig.value;
    }

    // Don't let discount exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return NextResponse.json({
      valid: true,
      discountAmount: Number(discountAmount.toFixed(2)),
      type: discountConfig.type,
      value: discountConfig.value
    });

  } catch (error) {
    console.error('[Validate Discount] Error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Failed to validate code' 
    }, { status: 500 });
  }
}