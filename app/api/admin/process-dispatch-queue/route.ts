// Path: app/api/admin/process-dispatch-queue/route.ts
// Vercel cron: runs every hour — sends scheduled dispatch emails
// v2

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { sendDispatchEmail } from '@/lib/email';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get('x-cron-secret') !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ensure columns exist
    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatch_email_scheduled_at TIMESTAMPTZ`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatch_email_sent_at TIMESTAMPTZ`;
    } catch (_) {}

    // Find orders whose scheduled time has passed and email not yet sent
    const pending = await sql`
      SELECT
        id, order_number, customer_email, customer_name, stripe_session_id,
        tracking_number, carrier,
        shipping_address_line1, shipping_address_line2, shipping_city,
        shipping_postal_code, shipping_country, items
      FROM orders
      WHERE
        fulfillment_status = 'shipped'
        AND dispatch_email_scheduled_at IS NOT NULL
        AND dispatch_email_scheduled_at <= NOW()
        AND dispatch_email_sent_at IS NULL
        AND customer_email IS NOT NULL
    ` as any[];

    console.log(`[DispatchQueue] Found ${pending.length} pending dispatch email(s)`);

    let sent = 0;
    let failed = 0;

    for (const order of pending) {
      try {
        let parsedItems = [];
        try {
          parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch (_) {
          parsedItems = [{ name: 'Items', quantity: 1, price: 0 }];
        }

        const carrier = order.carrier || 'Royal Mail';
        const trackingNumber = order.tracking_number || '';

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

        await sql`UPDATE orders SET dispatch_email_sent_at = NOW() WHERE id = ${order.id}`;
        sent++;
        console.log(`[DispatchQueue] Sent email for order #${order.order_number}`);
      } catch (err) {
        failed++;
        console.error(`[DispatchQueue] Failed for order #${order.order_number}:`, err);
      }
    }

    // Auto-generate blog article on Mondays
    const now = new Date();
    if (now.getUTCDay() === 1) {
      try {
        const lastWeek = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        const recent = await sql`SELECT id FROM blog_posts WHERE created_at >= ${lastWeek.toISOString()} LIMIT 1`;
        if (recent.length === 0) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.mcdodo.co.uk';
          const genRes = await fetch(`${baseUrl}/api/admin/blog/generate`, {
            method: 'POST',
            headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
          });
          if (genRes.ok) {
            console.log('[DispatchQueue] Weekly blog article generated');
          }
        }
      } catch (blogErr) {
        console.error('[DispatchQueue] Blog generation failed:', blogErr);
      }
    }

    return NextResponse.json({ success: true, sent, failed });
  } catch (error) {
    console.error('[DispatchQueue] Cron error:', error);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
