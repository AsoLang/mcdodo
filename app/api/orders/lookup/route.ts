// Path: app/api/orders/lookup/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    // 1. Check if order already exists
    const existingOrder = await sql`
      SELECT order_number FROM orders WHERE stripe_session_id = ${sessionId}
    `;

    if (existingOrder.length > 0) {
      return NextResponse.json({ found: true, order_number: existingOrder[0].order_number });
    }

    // 2. Fetch from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer_details', 'line_items.data.price.product'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // 3. Prepare Data
    const amountTotal = (session.amount_total || 0) / 100;
    const email = session.customer_details?.email || '';
    const name = session.customer_details?.name || 'Guest';
    
    // SAFE ADDRESS EXTRACTION (Fixes the red lines)
    const rawAddress = session.customer_details?.address;
    const address = {
      line1: rawAddress?.line1 || null,
      line2: rawAddress?.line2 || null,
      city: rawAddress?.city || null,
      postal_code: rawAddress?.postal_code || null,
      country: rawAddress?.country || null,
    };
    
    // Calculate Shipping & Build Items JSON
    let shippingCost = 0;
    const itemsArray: any[] = [];
    
    session.line_items?.data.forEach((item) => {
      if (item.description === 'Standard Delivery (Royal Mail / Evri)') {
        shippingCost = (item.amount_total || 0) / 100;
      } else {
        const product = item.price?.product as Stripe.Product;
        itemsArray.push({
          name: product?.name || item.description,
          quantity: item.quantity,
          price: (item.amount_total || 0) / 100 / (item.quantity || 1),
          variant_id: product?.metadata?.variantId || null,
          color: product?.metadata?.color || null,
          size: product?.metadata?.size || null,
          sku: product?.metadata?.sku || null,
          image: product?.images?.[0] || ''
        });
      }
    });

    const subtotal = amountTotal - shippingCost;

    // 4. INSERT into 'orders'
    // Using the safe 'address' object we created above
    const insertedOrder = await sql`
      INSERT INTO orders (
        email,
        financial_status,
        fulfillment_status,
        currency,
        subtotal,
        shipping,
        total,
        shipping_method,
        payment_method,
        created_at,
        paid_at,
        stripe_session_id,
        customer_email,
        customer_name,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        items,
        status,
        payment_status
      ) VALUES (
        ${email},
        'PAID',
        'UNFULFILLED',
        'GBP',
        ${subtotal},
        ${shippingCost},
        ${amountTotal},
        'Standard Delivery',
        'Stripe',
        NOW(),
        NOW(),
        ${sessionId},
        ${email},
        ${name},
        ${address.line1},       -- Safe usage
        ${address.line2},       -- Safe usage
        ${address.city},        -- Safe usage
        ${address.postal_code}, -- Safe usage
        ${address.country},     -- Safe usage
        ${JSON.stringify(itemsArray)},
        'confirmed',
        'paid'
      )
      RETURNING order_number
    `;

    // 5. Return the generated Order Number
    return NextResponse.json({ found: true, order_number: insertedOrder[0].order_number });

  } catch (error: any) {
    console.error('[Order Lookup] Sync Failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
