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

// --- HELPER TO SUBTRACT STOCK ---
async function decrementStock(items: any[]) {
  try {
    for (const item of items) {
      if (item.id) {
        await sql`
          UPDATE products 
          SET stock = GREATEST(0, stock - ${item.quantity})
          WHERE id = ${item.id}
        `;
      }
    }
  } catch (error) {
    console.error('Failed to decrement stock:', error);
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

    // 1. Retrieve full details (including line items)
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    const customerEmail = session.customer_details?.email || '';
    const customerName = session.customer_details?.name || 'Customer';
    const amountTotal = (session.amount_total || 0) / 100;
    
    // --- FIX: Cast to 'any' to suppress the "shipping_details" error ---
    const shippingDetails = (session as any).shipping_details;
    const shipping = shippingDetails?.address;
    
    const address = {
      line1: shipping?.line1 || null,
      line2: shipping?.line2 || null,
      city: shipping?.city || null,
      postal_code: shipping?.postal_code || null,
      country: shipping?.country || null,
    };

    // Extract Items
    const items = fullSession.line_items?.data.map((item) => {
      const product = item.price?.product as Stripe.Product;
      return {
        id: product.metadata?.variantId || null, 
        name: product.name,
        quantity: item.quantity || 1,
        price: (item.amount_total || 0) / 100 / (item.quantity || 1),
      };
    }) || [];

    // Calculate Shipping Cost
    const shippingCost = fullSession.total_details?.amount_shipping 
      ? fullSession.total_details.amount_shipping / 100 
      : 0;

    try {
      // 2. Insert Order into Database
      const result = await sql`
        INSERT INTO orders (
          stripe_session_id,
          customer_email,
          customer_name,
          total_amount,
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

      console.log(`✅ Order #${orderNumber} saved.`);

      // 3. SUBTRACT STOCK
      await decrementStock(items);
      console.log(`📉 Stock updated for Order #${orderNumber}`);

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

    } catch (error: any) {
      if (error.code === '23505') { 
        console.log('Order already processed (duplicate event).');
        return NextResponse.json({ received: true });
      }
      console.error('Error processing order:', error);
      return NextResponse.json({ error: 'Error processing order' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}