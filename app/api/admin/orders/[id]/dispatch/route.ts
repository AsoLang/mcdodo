// Path: app/api/admin/orders/[id]/dispatch/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import { sendDispatchEmail } from '@/lib/email';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_auth');
    if (!adminAuth || adminAuth.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { trackingNumber, carrier } = await request.json();

    // Update order
    await sql`
      UPDATE orders
      SET 
        fulfillment_status = 'shipped',
        tracking_number = ${trackingNumber},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    // Get order details for email
    const order = await sql`
      SELECT customer_email, customer_name, stripe_session_id
      FROM orders
      WHERE id = ${id}
    `;

    if (order.length > 0) {
      // Send dispatch email
      await sendDispatchEmail({
        email: order[0].customer_email,
        name: order[0].customer_name,
        orderId: order[0].stripe_session_id,
        trackingNumber,
        carrier,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to dispatch order:', error);
    return NextResponse.json({ error: 'Failed to dispatch order' }, { status: 500 });
  }
}