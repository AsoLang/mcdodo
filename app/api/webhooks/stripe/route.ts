// Path: app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { sendOrderConfirmationEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

const sql = neon(process.env.DATABASE_URL!);

// --- STOCK UPDATE LOGIC (Variant + Parent) ---
async function decrementStock(items: any[]) {
  console.log('[Stock Update] Starting stock decrement for items:', items);
  
  for (const item of items) {
    if (item.id) {
      try {
        // 1. Update the VARIANT stock
        const variantResult = await sql`
          UPDATE product_variants 
          SET stock = GREATEST(0, stock - ${item.quantity})
          WHERE id = ${item.id}
          RETURNING product_id, stock
        `;

        if (variantResult.length > 0) {
          console.log(`✅ [Stock Update] Variant ${item.id} new stock: ${variantResult[0].stock}`);

          // 2. Update the PARENT product stock
          const parentId = variantResult[0].product_id;
          if (parentId) {
            const parentResult = await sql`
              UPDATE products 
              SET stock = GREATEST(0, stock - ${item.quantity})
              WHERE id = ${parentId}
              RETURNING stock
            `;
            console.log(`✅ [Stock Update] Parent Product ${parentId} new stock: ${parentResult[0].stock}`);
          }
        } else {
           console.warn(`⚠️ [Stock Update] Variant ID ${item.id} not found.`);
        }
      } catch (error) {
        console.error(`❌ [Stock Update] Failed for ID ${item.id}:`, error);
      }
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // 1. Retrieve full details
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    const customerEmail = session.customer_details?.email || '';
    const customerName = session.customer_details?.name || 'Customer';
    const amountTotal = (session.amount_total || 0) / 100;
    
    // Cast to 'any' to suppress the "shipping_details" error
    const shippingDetails = (session as any).shipping_details;
    const shipping = shippingDetails?.address;
    
    const address = {
      line1: shipping?.line1 || null,
      line2: shipping?.line2 || null,
      city: shipping?.city || null,
      postal_code: shipping?.postal_code || null,
      country: shipping?.country || null,
    };

    const items = fullSession.line_items?.data.map((item) => {
      const product = item.price?.product as Stripe.Product;
      return {
        id: product.metadata?.productId || null, 
        name: product.name,
        quantity: item.quantity || 1,
        price: (item.amount_total || 0) / 100 / (item.quantity || 1),
      };
    }) || [];

    const shippingCost = fullSession.total_details?.amount_shipping 
      ? fullSession.total_details.amount_shipping / 100 
      : 0;

    try {
      console.log(`[Webhook] Processing Order...`);

      // 2. Insert Order into Database
      const result = await sql`
        INSERT INTO orders (
          stripe_session_id,
          email,              -- FIX: Populating the required 'email' column
          customer_email,
          customer_name,
          total,
          status,
          items,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_postal_code,
          shipping_country
        )
        VALUES (
          ${session.id},
          ${customerEmail},   -- FIX: Value for 'email'
          ${customerEmail},
          ${customerName},
          ${amountTotal},
          'paid',
          ${JSON.stringify(items)},
          ${address.line1},
          ${address.line2},
          ${address.city},
          ${address.postal_code},
          ${address.country}
        )
        RETURNING order_number, created_at
      `;

      const orderNumber = result[0].order_number;
      const orderDate = new Date(result[0].created_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      console.log(`✅ [Webhook] Order #${orderNumber} saved.`);

      // 3. SUBTRACT STOCK
      await decrementStock(items);

      // 4. Send Confirmation Email
      await sendOrderConfirmationEmail({
        email: customerEmail,
        name: customerName,
        orderId: orderNumber.toString(),
        date: orderDate,
        shippingAddress: address,
        items: items,
        shippingTotal: shippingCost,
        total: amountTotal,
      });

      // 5. Mark Email as Sent
      await sql`
        UPDATE orders 
        SET confirmation_email_sent_at = NOW() 
        WHERE stripe_session_id = ${session.id}
      `;

      console.log(`✅ [Webhook] Order fully processed.`);

    } catch (error: any) {
      if (error.code === '23505') { 
        console.log('[Webhook] Order already processed (duplicate event).');
        return NextResponse.json({ received: true });
      }
      console.error('[Webhook] Error processing order:', error);
      return NextResponse.json({ error: 'Error processing order' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}