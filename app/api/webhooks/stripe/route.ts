// Path: app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';
import { sendAdminOrderNotificationEmail, sendOrderConfirmationEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

const sql = neon(process.env.DATABASE_URL!);

async function decrementStock(items: any[]) {
  const productItems = items.filter(item => item.id !== null);
  
  if (productItems.length === 0) return;

  console.log('[Stock Update] Decrementing stock for:', productItems);
  
  for (const item of productItems) {
    try {
      const variantResult = await sql`
        UPDATE product_variants 
        SET stock = GREATEST(0, stock - ${item.quantity})
        WHERE id = ${item.id}
        RETURNING product_id, stock
      `;

      if (variantResult.length > 0) {
        const parentId = variantResult[0].product_id;
        if (parentId) {
          await sql`
            UPDATE products 
            SET stock = GREATEST(0, stock - ${item.quantity})
            WHERE id = ${parentId}
          `;
        }
        console.log(`✅ Stock updated for variant ${item.id}: ${variantResult[0].stock} remaining`);
      }
    } catch (error) {
      console.error(`❌ [Stock Update] Failed for ID ${item.id}:`, error);
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    const customerEmail = session.customer_details?.email || '';
    const customerName = session.customer_details?.name || 'Customer';
    const amountTotal = (session.amount_total || 0) / 100;

    const sessionData = session as any;
    const shippingDetails = sessionData.shipping_details || sessionData.customer_details;
    const shippingAddress = shippingDetails?.address;
    
    const address = {
      line1: shippingAddress?.line1 || null,
      line2: shippingAddress?.line2 || null,
      city: shippingAddress?.city || null,
      postal_code: shippingAddress?.postal_code || null,
      country: shippingAddress?.country || null,
    };

    let detectedShippingCost = 0;
    
    if (fullSession.total_details?.amount_shipping) {
      detectedShippingCost += (fullSession.total_details.amount_shipping / 100);
    }

    let items = fullSession.line_items?.data
      .reduce((acc: any[], item) => {
        const product = item.price?.product as Stripe.Product;
        const name = product.name;
        const price = (item.amount_total || 0) / 100 / (item.quantity || 1);

        // Check metadata first for shipping flag
        const isShipping = (item as any).metadata?.isShipping === 'true';

        if (isShipping || name.toLowerCase() === 'shipping' || name.toLowerCase().includes('delivery')) {
          detectedShippingCost += price;
          return acc;
        }

        const productMeta = product?.metadata || {};
        const variantId = productMeta.variantId || (item as any).metadata?.variantId || null;
        const color = productMeta.color || null;
        const size = productMeta.size || null;

        console.log(`[Webhook] Item: ${name}, variantId: ${variantId}`);

        acc.push({
          id: variantId,
          variant_id: variantId,
          name: name,
          quantity: item.quantity || 1,
          price: price,
          color,
          size,
        });
        return acc;
      }, []) || [];

    const variantIds = items.map(item => item.variant_id).filter(Boolean);
    if (variantIds.length > 0) {
      const rows = await sql`
        SELECT pv.id::text AS variant_id, p.product_url
        FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE pv.id = ANY(${variantIds})
      `;
      const productUrlByVariant = new Map(rows.map((row: any) => [String(row.variant_id), row.product_url]));
      items = items.map(item => {
        const productUrl = item.variant_id ? productUrlByVariant.get(String(item.variant_id)) : null;
        return productUrl ? { ...item, product_url: productUrl } : item;
      });
    }

    try {
      const result = await sql`
        INSERT INTO orders (
          stripe_session_id,
          email,
          customer_email,
          customer_name,
          total,
          status,
          items,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_postal_code,
          shipping_country,
          created_at
        )
        VALUES (
          ${session.id},
          ${customerEmail},
          ${customerEmail},
          ${customerName},
          ${amountTotal},
          'paid',
          ${JSON.stringify(items)},
          ${address.line1},
          ${address.line2},
          ${address.city},
          ${address.postal_code},
          ${address.country},
          NOW()
        )
        RETURNING order_number, created_at
      `;

      const orderNumber = result[0].order_number;
      const rawDate = result[0].created_at;

      console.log(`✅ [Webhook] Order #${orderNumber} saved.`);

      await decrementStock(items);

      await sendOrderConfirmationEmail({
        email: customerEmail,
        name: customerName,
        orderId: orderNumber.toString(),
        date: rawDate,
        shippingAddress: address,
        items: items,
        shippingTotal: detectedShippingCost,
        total: amountTotal,
      });

      const adminEmail =
        process.env.ADMIN_ORDER_EMAIL ||
        process.env.CONTACT_TO_EMAIL ||
        process.env.ORDER_FROM_EMAIL;

      if (adminEmail) {
        await sendAdminOrderNotificationEmail({
          email: adminEmail,
          orderId: orderNumber.toString(),
          date: rawDate,
          customerName,
          customerEmail,
          shippingAddress: address,
          items,
          shippingTotal: detectedShippingCost,
          total: amountTotal,
        });
      }

      await sql`
        UPDATE orders 
        SET confirmation_email_sent_at = NOW() 
        WHERE stripe_session_id = ${session.id}
      `;

    } catch (error: any) {
      if (error.code === '23505') return NextResponse.json({ received: true });
      console.error('[Webhook] Error:', error);
      return NextResponse.json({ error: 'Error processing order' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
