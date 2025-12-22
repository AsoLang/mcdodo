// Path: app/api/checkout/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Added "as any" to fix the red line in VS Code
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: Request) {
  try {
    const { items, shippingCost } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const line_items = items.map((item: any) => {
      // 1. Generate the description string first
      // .filter(Boolean) removes null, undefined, or empty strings
      const descriptionText = [item.color, item.size].filter(Boolean).join(', ');

      // 2. Build the product_data object
      const productData: any = {
        name: item.title,
        images: item.image ? [item.image] : [],
        metadata: {
          variantId: item.id,
        }
      };

      // 3. THE FIX: ONLY add description if it actually contains text
      if (descriptionText && descriptionText.length > 0) {
        productData.description = descriptionText;
      }

      return {
        price_data: {
          currency: 'gbp',
          product_data: productData,
          unit_amount: Math.round((item.onSale ? item.salePrice : item.price) * 100),
        },
        quantity: item.quantity,
      };
    });

    // Add Shipping Line Item (if applicable)
    if (shippingCost && shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Shipping',
            description: 'Standard Delivery (Royal Mail / Evri)',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/`, 
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}