// Path: app/api/admin/orders/[id]/dispatch/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { sendDispatchEmail } from '@/lib/email';
import { cookies } from 'next/headers';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'true';
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
    const { trackingNumber, carrier } = await request.json();

    console.log(`[Dispatch] Attempting to dispatch Order Identifier: ${id} via ${carrier}`);

    // 1. Update order in Database
    // We cast the result to 'any' to stop TypeScript from complaining about dynamic columns
    let updateResult: any[] = [];
    try {
      updateResult = await sql`
        UPDATE orders
        SET 
          fulfillment_status = 'shipped',
          tracking_number = ${trackingNumber},
          carrier = ${carrier}
        WHERE id::text = ${id} OR order_number::text = ${id}
        RETURNING 
          id, 
          order_number, 
          customer_email, 
          customer_name, 
          stripe_session_id,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_postal_code,
          shipping_country,
          items
      ` as any[];
    } catch (err) {
      updateResult = await sql`
        UPDATE orders
        SET 
          fulfillment_status = 'shipped',
          tracking_number = ${trackingNumber}
        WHERE id::text = ${id} OR order_number::text = ${id}
        RETURNING 
          id, 
          order_number, 
          customer_email, 
          customer_name, 
          stripe_session_id,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_postal_code,
          shipping_country,
          items
      ` as any[];
    }

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = updateResult[0];
    console.log(`[Dispatch] Successfully updated Order #${order.order_number}`);

    // 2. Send Dispatch Email
    if (order.customer_email) {
      console.log(`[Dispatch] Sending email to ${order.customer_email}`);

      // Safe parsing of items (handles both string JSON and object JSON)
      let parsedItems = [];
      try {
        parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        console.error("Error parsing items:", e);
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
          country: order.shipping_country
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Dispatch] Failed:', error);
    return NextResponse.json({ error: 'Failed to dispatch order' }, { status: 500 });
  }
}
