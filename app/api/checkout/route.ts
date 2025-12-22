// Path: app/api/checkout/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: Request) {
  try {
    const { items, shippingCost } = await req.json();

    // --- DYNAMIC ORIGIN DETECTION ---
    // This automatically grabs "https://mcdodo.co.uk" in prod
    // or "http://localhost:3000" in dev.
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const line_items = items.map((item: any) => {
      const descriptionText = [item.color, item.size].filter(Boolean).join(', ');

      const productData: any = {
        name: item.title,
        images: item.image ? [item.image] : [],
        metadata: {
          variantId: item.id,
        }
      };

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
      // NOW USES THE DYNAMIC ORIGIN:
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`, 
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}