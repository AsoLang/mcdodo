// Path: app/api/checkout/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: Request) {
  try {
    const { items, shippingCost } = await req.json();

    console.log('========== CHECKOUT DEBUG START ==========');
    console.log('[Checkout DEBUG] Raw request body:');
    console.log(JSON.stringify({ items, shippingCost }, null, 2));
    console.log('[Checkout DEBUG] Number of items:', items?.length);

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    console.log('[Checkout DEBUG] Origin:', origin);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const line_items = items.map((item: any, index: number) => {
      console.log(`\n[Checkout DEBUG] Processing item #${index + 1}:`);
      console.log('  - item object:', JSON.stringify(item, null, 2));
      console.log('  - item.id:', item.id);
      console.log('  - typeof item.id:', typeof item.id);

      const descriptionText = [item.color, item.size].filter(Boolean).join(', ');

      const productData: any = {
        name: item.title,
        images: item.image ? [item.image] : [],
      };

      if (descriptionText && descriptionText.length > 0) {
        productData.description = descriptionText;
      }

      console.log('  - Storing productId in line item metadata:', item.id);

      return {
        price_data: {
          currency: 'gbp',
          product_data: productData,
          unit_amount: Math.round((item.onSale ? item.salePrice : item.price) * 100),
        },
        quantity: item.quantity,
        metadata: {
          productId: String(item.id),
        }
      };
    });

    console.log('\n[Checkout DEBUG] Total line_items created:', line_items.length);

    if (shippingCost && shippingCost > 0) {
      console.log('[Checkout DEBUG] Adding shipping cost:', shippingCost);
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
        metadata: {
          isShipping: 'true',
        }
      });
    }

    console.log('[Checkout DEBUG] Creating Stripe session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      
      shipping_address_collection: {
        allowed_countries: ['GB'], 
      },

      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`, 
    });

    console.log('[Checkout DEBUG] Stripe session created:', session.id);
    console.log('========== CHECKOUT DEBUG END ==========\n');

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('❌ [Checkout] Stripe Checkout Error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}