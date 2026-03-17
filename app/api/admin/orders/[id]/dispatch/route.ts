// Path: app/api/admin/orders/[id]/dispatch/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { sendDispatchEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  return token ? await verifySessionToken(token) : false;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { trackingNumber, carrier, delayHours = 0 } = await request.json();

    console.log(`[Dispatch] Order ${id} via ${carrier}, email delay: ${delayHours}h`);

    // Ensure scheduling columns exist
    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatch_email_scheduled_at TIMESTAMPTZ`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatch_email_sent_at TIMESTAMPTZ`;
    } catch (_) {}

    const sendAt = delayHours > 0
      ? new Date(Date.now() + delayHours * 3600 * 1000).toISOString()
      : new Date().toISOString();

    // Update order in DB
    let updateResult: any[] = [];
    try {
      updateResult = await sql`
        UPDATE orders
        SET
          fulfillment_status = 'shipped',
          tracking_number = ${trackingNumber},
          carrier = ${carrier},
          dispatch_email_scheduled_at = ${sendAt}
        WHERE id::text = ${id} OR order_number::text = ${id}
        RETURNING
          id, order_number, customer_email, customer_name, stripe_session_id,
          shipping_address_line1, shipping_address_line2, shipping_city,
          shipping_postal_code, shipping_country, items
      ` as any[];
    } catch (err) {
      updateResult = await sql`
        UPDATE orders
        SET
          fulfillment_status = 'shipped',
          tracking_number = ${trackingNumber}
        WHERE id::text = ${id} OR order_number::text = ${id}
        RETURNING
          id, order_number, customer_email, customer_name, stripe_session_id,
          shipping_address_line1, shipping_address_line2, shipping_city,
          shipping_postal_code, shipping_country, items
      ` as any[];
    }

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = updateResult[0];

    // If no delay, send email immediately
    if (delayHours === 0 && order.customer_email) {
      let parsedItems = [];
      try {
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        parsedItems = [{ name: 'Items', quantity: 1, price: 0 }];
      }

      await sendDispatchEmail({
        email: order.customer_email,
        name: order.customer_name || 'Customer',
        orderId: order.order_number?.toString() || order.stripe_session_id?.slice(0, 8),
        trackingNumber,
        carrier,
        items: parsedItems,
        shippingAddress: {
          line1: order.shipping_address_line1,
          line2: order.shipping_address_line2,
          city: order.shipping_city,
          postal_code: order.shipping_postal_code,
          country: order.shipping_country,
        },
      });

      // Mark email as sent
      try {
        await sql`UPDATE orders SET dispatch_email_sent_at = NOW() WHERE id::text = ${id} OR order_number::text = ${id}`;
      } catch (_) {}
    }

    return NextResponse.json({ success: true, scheduled: delayHours > 0, sendAt });
  } catch (error) {
    console.error('[Dispatch] Failed:', error);
    return NextResponse.json({ error: 'Failed to dispatch order' }, { status: 500 });
  }
}
