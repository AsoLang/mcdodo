// Path: app/api/webhooks/stripe/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
// Import from the file we just updated
import { sendOrderConfirmationEmail } from '@/lib/email';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20' as any,
  typescript: true,
});

const sql = neon(process.env.DATABASE_URL!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;

    try {
      console.log(`[Webhook] Processing session: ${sessionId}`);

      const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'customer_details', 'line_items.data.price.product'],
      });

      const customerEmail = fullSession.customer_details?.email || '';
      const customerName = fullSession.customer_details?.name || 'Guest';
      
      const rawAddress = fullSession.customer_details?.address;
      const address = {
        line1: rawAddress?.line1 ?? null,
        line2: rawAddress?.line2 ?? null,
        city: rawAddress?.city ?? null,
        postal_code: rawAddress?.postal_code ?? null,
        country: rawAddress?.country ?? null,
      };

      const amountTotal = (fullSession.amount_total || 0) / 100;
      
      let shippingCost = 0;
      const itemsArray: any[] = [];
      const lineItems = fullSession.line_items?.data || [];

      for (const item of lineItems) {
        const description = item.description || '';
        if (description.toLowerCase().includes('delivery') || description.toLowerCase().includes('shipping')) {
          shippingCost = (item.amount_total || 0) / 100;
          continue;
        }

        const product = item.price?.product as Stripe.Product | undefined;
        const productName = product?.name || description || 'Unknown Item';
        const productImage = product?.images?.[0] || '';
        const variantId = product?.metadata?.variantId || null;
        const itemQuantity = item.quantity || 1;
        const itemPrice = (item.amount_total || 0) / 100 / itemQuantity;

        itemsArray.push({
          name: productName,
          quantity: itemQuantity,
          price: itemPrice,
          variant_id: variantId,
          image: productImage
        });
      }

      const subtotal = amountTotal - shippingCost;

      // DB OPERATION
      let orderRecord = await sql`
        SELECT id, order_number, confirmation_email_sent_at 
        FROM orders 
        WHERE stripe_session_id = ${sessionId}
      `;

      if (orderRecord.length === 0) {
        orderRecord = await sql`
          INSERT INTO orders (
            email, financial_status, fulfillment_status, currency,
            subtotal, shipping, total, shipping_method, payment_method,
            created_at, paid_at, stripe_session_id, customer_email,
            customer_name, shipping_address_line1, shipping_address_line2,
            shipping_city, shipping_postal_code, shipping_country,
            items, status, payment_status
          ) VALUES (
            ${customerEmail}, 'PAID', 'UNFULFILLED', 'GBP',
            ${subtotal}, ${shippingCost}, ${amountTotal}, 'Standard Delivery', 'Stripe',
            NOW(), NOW(), ${sessionId}, ${customerEmail},
            ${customerName}, ${address.line1}, ${address.line2},
            ${address.city}, ${address.postal_code}, ${address.country},
            ${JSON.stringify(itemsArray)}, 'confirmed', 'paid'
          )
          RETURNING id, order_number, confirmation_email_sent_at
        `;
        console.log(`[Webhook] Created new order #${orderRecord[0].order_number}`);
      }

      const order = orderRecord[0];

      if (order.confirmation_email_sent_at) {
        console.log(`[Webhook] Email already sent for #${order.order_number}. Skipping.`);
        return NextResponse.json({ received: true, status: 'already_sent' });
      }

      console.log(`[Webhook] Sending confirmation email for #${order.order_number}...`);
      
      // --- UPDATED CALL ---
      const emailResult = await sendOrderConfirmationEmail({
        email: customerEmail,
        name: customerName,
        orderId: order.order_number.toString(),
        items: itemsArray,
        total: amountTotal,
        shippingTotal: shippingCost, // Passing Shipping
        shippingAddress: address,    // Passing Address
        date: new Date().toLocaleString('en-GB', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }) // Passing Formatted Date
      });

      if (emailResult.success) {
        await sql`
          UPDATE orders 
          SET confirmation_email_sent_at = NOW() 
          WHERE id = ${order.id}
        `;
        console.log(`[Webhook] Email sent & logged for #${order.order_number}`);
      } else {
        console.error(`[Webhook] Failed to send email for #${order.order_number}:`, emailResult.error);
      }

    } catch (err) {
      console.error('[Webhook] Processing Failed:', err);
      return NextResponse.json({ error: 'Processing Failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}