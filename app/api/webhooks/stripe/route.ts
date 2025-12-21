// Path: app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { sendOrderConfirmationEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const sql = neon(process.env.DATABASE_URL!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Get line items from session
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });

      // Transform line items for database
      const items = lineItems.data.map((item: any) => ({
        name: item.description,
        quantity: item.quantity,
        price: item.amount_total / 100,
        image: item.price?.product?.images?.[0] || null,
      }));

      // Save order to database
      await sql`
        INSERT INTO orders (
          stripe_session_id,
          stripe_payment_intent,
          customer_email,
          customer_name,
          customer_phone,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_postal_code,
          shipping_country,
          items,
          subtotal,
          total,
          status,
          payment_status
        ) VALUES (
          ${session.id},
          ${session.payment_intent as string},
          ${session.customer_details?.email || ''},
          ${session.customer_details?.name || ''},
          ${session.customer_details?.phone || null},
          ${session.shipping_details?.address?.line1 || null},
          ${session.shipping_details?.address?.line2 || null},
          ${session.shipping_details?.address?.city || null},
          ${session.shipping_details?.address?.postal_code || null},
          ${session.shipping_details?.address?.country || null},
          ${JSON.stringify(items)},
          ${session.amount_subtotal! / 100},
          ${session.amount_total! / 100},
          'confirmed',
          'paid'
        )
      `;

      console.log('[Webhook] Order saved:', session.id);

      // Send confirmation email
      if (session.customer_details?.email) {
        await sendOrderConfirmationEmail({
          email: session.customer_details.email,
          name: session.customer_details.name || 'Customer',
          orderId: session.id,
          items,
          total: session.amount_total! / 100,
        });
        console.log('[Webhook] Confirmation email sent');
      }

    } catch (error) {
      console.error('[Webhook] Error saving order:', error);
      return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}