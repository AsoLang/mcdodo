// Path: app/api/checkout/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: Request) {
  try {
    const { items, shippingCost } = await req.json();

    // Dynamic origin for localhost vs production
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
          // CRITICAL: Convert to string for Stripe metadata
          productId: String(item.id),
        }
      };

      if (descriptionText && descriptionText.length > 0) {
        productData.description = descriptionText;
      }

      console.log(`[Checkout] Product: ${item.title}, ID: ${item.id}, Qty: ${item.quantity}`);

      return {
        price_data: {
          currency: 'gbp',
          product_data: productData,
          unit_amount: Math.round((item.onSale ? item.salePrice : item.price) * 100),
        },
        quantity: item.quantity,
      };
    });

    // Add Shipping Cost as a line item
    if (shippingCost && shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Shipping',
            description: 'Standard Delivery (Royal Mail / Evri)',
            metadata: {
              isShipping: 'true', // Mark shipping items
            }
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
      
      shipping_address_collection: {
        allowed_countries: ['GB'], 
      },

      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`, 
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}