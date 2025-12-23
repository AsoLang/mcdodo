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
  console.log('[Stock Update] Starting stock decrement for items:', items);
  
  try {
    for (const item of items) {
      // Handle both UUID and integer product IDs
      const productId = item.id || null;
      
      if (productId) {
        console.log(`[Stock Update] Decrementing stock for Product ID ${productId} by ${item.quantity}`);
        
        const result = await sql`
          UPDATE products 
          SET stock = GREATEST(0, stock - ${item.quantity})
          WHERE id = ${productId}
          RETURNING id, title, stock
        `;
        
        if (result.length > 0) {
          console.log(`✅ [Stock Update] Product "${result[0].title}" (ID: ${result[0].id}) - New stock: ${result[0].stock}`);
        } else {
          console.warn(`⚠️ [Stock Update] Product ID ${productId} not found in database`);
        }
      } else {
        console.warn(`⚠️ [Stock Update] Missing product ID for item:`, item);
      }
    }
    console.log('[Stock Update] ✅ Stock decrement completed');
  } catch (error) {
    console.error('❌ [Stock Update] Failed to decrement stock:', error);
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
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.log(`[Webhook] Event type: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log(`[Webhook] Processing session: ${session.id}`);

    // 1. Retrieve full details (including line items)
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

    // Extract Items with proper metadata handling
    const items = fullSession.line_items?.data
      .filter((item) => {
        const product = item.price?.product as Stripe.Product;
        // Skip shipping items
        return product?.metadata?.isShipping !== 'true';
      })
      .map((item) => {
        const product = item.price?.product as Stripe.Product;
        const productId = product.metadata?.productId;
        
        console.log(`[Webhook] Line Item: ${product.name}, Metadata ProductID: ${productId}, Quantity: ${item.quantity}`);
        
        return {
          id: productId || null, // Keep as string initially, will be converted in decrementStock
          name: product.name,
          quantity: item.quantity || 1,
          price: (item.amount_total || 0) / 100 / (item.quantity || 1),
        };
      }) || [];

    console.log(`[Webhook] Extracted ${items.length} items from order`);

    // Calculate Shipping Cost
    const shippingCost = fullSession.total_details?.amount_shipping 
      ? fullSession.total_details.amount_shipping / 100 
      : 0;

    try {
      // Insert Order into Database
      const result = await sql`
        INSERT INTO orders (
          stripe_session_id,
          email,
          customer_email,
          customer_name,
          total,
          status,
          payment_status,
          fulfillment_status,
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
          ${customerEmail},
          ${customerName},
          ${amountTotal},
          'confirmed',
          'paid',
          'unfulfilled',
          ${JSON.stringify(items)},
          ${address.line1},
          ${address.line2},
          ${address.city},
          ${address.postal_code},
          ${address.country}
        )
        ON CONFLICT (stripe_session_id) DO UPDATE
        SET stripe_session_id = EXCLUDED.stripe_session_id
        RETURNING order_number, created_at, confirmation_email_sent_at
      `;

      const orderNumber = result[0].order_number;
      const orderDate = new Date(result[0].created_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      const emailAlreadySent = result[0].confirmation_email_sent_at;

      console.log(`✅ [Webhook] Order #${orderNumber} processed`);

      // Always decrement stock (idempotent - won't go below 0)
      await decrementStock(items);

      // Only send email if not already sent
      if (!emailAlreadySent) {
        try {
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
          
          console.log(`📧 [Webhook] Confirmation email sent to ${customerEmail}`);

          // Mark Email as Sent
          await sql`
            UPDATE orders 
            SET confirmation_email_sent_at = NOW() 
            WHERE stripe_session_id = ${session.id}
          `;
        } catch (emailError) {
          console.error('❌ [Webhook] Email failed (non-critical):', emailError);
          // Don't fail the webhook if email fails
        }
      } else {
        console.log(`ℹ️ [Webhook] Email already sent for order #${orderNumber}`);
      }

      console.log(`✅ [Webhook] Order #${orderNumber} fully processed`);

    } catch (error: any) {
      console.error('❌ [Webhook] Error processing order:', error);
      return NextResponse.json({ error: 'Error processing order' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}