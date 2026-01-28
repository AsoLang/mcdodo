// Path: app/api/apple-pay-checkout/route.ts

import { NextResponse } from 'next/server';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  try {
    const { productId, variantId, title, price, image, productUrl, color, size, quantity } = await req.json();

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

    // Ensure base URL has https://
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.mcdodo.co.uk';
    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/shop/p/${productUrl}`;

    const line_items = [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: fullTitle,
            images: [image],
            metadata: {
              productId,
              ...(variantId && { variantId }),
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
            images: [],
            metadata: { isShipping: 'true' }
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      // FIX: Only use 'card' - Apple Pay shows automatically on iOS Safari
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      metadata: {
        source: 'apple_pay_quick_buy',
        productId,
        ...(variantId && { variantId }),
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Apple Pay checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
