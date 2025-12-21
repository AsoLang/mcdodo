// Path: app/api/checkout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();

    // Create line items for Stripe
    const lineItems = items.map((item: any) => {
      const description = `${item.color || ''} ${item.size || ''}`.trim();
      
      const productData: any = {
        name: item.title,
        images: item.image ? [item.image] : [],
      };
      
      // Only add description if it has actual content
      if (description.length > 0) {
        productData.description = description;
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/checkout/cancel`,
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}