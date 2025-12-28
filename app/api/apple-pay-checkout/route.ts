// Path: app/api/apple-pay-checkout/route.ts

import { NextResponse } from 'next/server';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  try {
    const { productId, title, price, image, productUrl, color, size, quantity } = await req.json();

    const SHIPPING_COST = 3.99;
    const FREE_SHIPPING_THRESHOLD = 20.00;

    const subtotal = price * quantity;
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

    // Build product name with variants
    let fullTitle = title;
    if (color || size) {
      const variants = [color, size].filter(Boolean).join(', ');
      fullTitle = `${title} (${variants})`;
    }

    const line_items = [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: fullTitle,
            images: [image],
            metadata: {
              productId,
              ...(color && { color }),
              ...(size && { size })
            }
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: quantity,
      }
    ];

    // Add shipping if not free
    if (shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Shipping',
            images: [], // FIX: Added empty images array
            metadata: { isShipping: 'true' }
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'apple_pay'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop/p/${productUrl}`,
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      metadata: {
        source: 'apple_pay_quick_buy',
        productId,
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Apple Pay checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}