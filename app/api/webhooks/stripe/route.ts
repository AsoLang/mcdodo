import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';
import Stripe from 'stripe';
import {
  sendAdminOrderNotificationEmail,
  sendOrderConfirmationEmail,
} from '@/lib/email';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type OrderItem = {
  id: string | null;
  variant_id: string | null;
  name: string;
  quantity: number;
  price: number;
  color: string | null;
  size: string | null;
  product_url?: string;
};

type ShippingAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
};

type SavedOrder = {
  created: boolean;
  orderNumber?: string;
  createdAt?: Date;
  items: OrderItem[];
};

async function saveOrderAndDecrementStock(
  client: PoolClient,
  session: Stripe.Checkout.Session,
  items: OrderItem[],
  address: ShippingAddress
): Promise<SavedOrder> {
  await client.query('BEGIN');

  try {
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      [session.id]
    );

    const existing = await client.query(
      `SELECT order_number, created_at
       FROM orders
       WHERE stripe_session_id = $1
       LIMIT 1`,
      [session.id]
    );

    if (existing.rowCount) {
      await client.query('COMMIT');
      return { created: false, items };
    }

    const variantIds = items
      .map((item) => item.variant_id)
      .filter((id): id is string => Boolean(id));
    let enrichedItems = items;

    if (variantIds.length > 0) {
      const productRows = await client.query(
        `SELECT pv.id::text AS variant_id, p.product_url
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE pv.id::text = ANY($1::text[])`,
        [variantIds]
      );
      const productUrlByVariant = new Map<string, string>(
        productRows.rows.map((row) => [
          String(row.variant_id),
          String(row.product_url),
        ])
      );

      enrichedItems = items.map((item) => {
        const productUrl = item.variant_id
          ? productUrlByVariant.get(item.variant_id)
          : undefined;
        return productUrl ? { ...item, product_url: productUrl } : item;
      });

      for (const item of enrichedItems) {
        if (!item.variant_id) continue;

        const variantResult = await client.query(
          `UPDATE product_variants
           SET stock = stock - $1
           WHERE id::text = $2
           RETURNING product_id`,
          [item.quantity, item.variant_id]
        );

        if (!variantResult.rowCount) {
          throw new Error(`Unknown variant in paid checkout: ${item.variant_id}`);
        }

        await client.query(
          `UPDATE products
           SET stock = GREATEST(0, stock - $1)
           WHERE id = $2`,
          [item.quantity, variantResult.rows[0].product_id]
        );
      }
    }

    const customerEmail =
      session.customer_details?.email || session.customer_email || '';
    const customerName = session.customer_details?.name || 'Customer';
    const amountTotal = (session.amount_total || 0) / 100;
    const device = session.metadata?.device || null;

    const inserted = await client.query(
      `INSERT INTO orders (
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
        device,
        created_at
      )
      VALUES (
        $1, $2, $2, $3, $4, 'paid', $5,
        $6, $7, $8, $9, $10, $11, NOW()
      )
      RETURNING order_number, created_at`,
      [
        session.id,
        customerEmail,
        customerName,
        amountTotal,
        JSON.stringify(enrichedItems),
        address.line1,
        address.line2,
        address.city,
        address.postal_code,
        address.country,
        device,
      ]
    );

    await client.query('COMMIT');
    return {
      created: true,
      orderNumber: String(inserted.rows[0].order_number),
      createdAt: inserted.rows[0].created_at,
      items: enrichedItems,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!webhookSecret || !signature) {
    return NextResponse.json(
      { error: 'Webhook is not configured' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'checkout.session.async_payment_succeeded'
  ) {
    return NextResponse.json({ received: true });
  }

  try {
    const eventSession = event.data.object as Stripe.Checkout.Session;
    const session = await stripe.checkout.sessions.retrieve(eventSession.id, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true });
    }

    const sessionWithShipping = session as Stripe.Checkout.Session & {
      shipping_details?: { address?: Stripe.Address | null } | null;
    };
    const shippingAddress =
      sessionWithShipping.shipping_details?.address ||
      session.customer_details?.address;
    const address: ShippingAddress = {
      line1: shippingAddress?.line1 || null,
      line2: shippingAddress?.line2 || null,
      city: shippingAddress?.city || null,
      postal_code: shippingAddress?.postal_code || null,
      country: shippingAddress?.country || null,
    };

    let shippingTotal = (session.total_details?.amount_shipping || 0) / 100;
    const items = (session.line_items?.data || []).reduce<OrderItem[]>(
      (result, lineItem) => {
        const expandedProduct =
          typeof lineItem.price?.product === 'object'
            ? lineItem.price.product
            : null;
        const product =
          expandedProduct && !('deleted' in expandedProduct)
            ? expandedProduct
            : null;
        const name = product?.name || lineItem.description || 'Item';
        const productMetadata = product?.metadata || {};
        const isShipping =
          productMetadata.isShipping === 'true' ||
          name.toLowerCase() === 'shipping' ||
          name.toLowerCase().includes('delivery');
        const quantity = lineItem.quantity || 1;
        const lineTotal = (lineItem.amount_total || 0) / 100;

        if (isShipping) {
          shippingTotal += lineTotal;
          return result;
        }

        const variantId = productMetadata.variantId || null;
        result.push({
          id: variantId,
          variant_id: variantId,
          name,
          quantity,
          price: lineTotal / quantity,
          color: productMetadata.color || null,
          size: productMetadata.size || null,
        });
        return result;
      },
      []
    );

    const client = await pool.connect();
    let savedOrder: SavedOrder;
    try {
      savedOrder = await saveOrderAndDecrementStock(
        client,
        session,
        items,
        address
      );
    } finally {
      client.release();
    }

    if (!savedOrder.created || !savedOrder.orderNumber || !savedOrder.createdAt) {
      return NextResponse.json({ received: true });
    }

    const customerEmail =
      session.customer_details?.email || session.customer_email || '';
    const customerName = session.customer_details?.name || 'Customer';
    const amountTotal = (session.amount_total || 0) / 100;

    try {
      await sendOrderConfirmationEmail({
        email: customerEmail,
        name: customerName,
        orderId: savedOrder.orderNumber,
        date: savedOrder.createdAt,
        shippingAddress: address,
        items: savedOrder.items,
        shippingTotal,
        total: amountTotal,
      });

      await pool.query(
        `UPDATE orders
         SET confirmation_email_sent_at = NOW()
         WHERE stripe_session_id = $1`,
        [session.id]
      );
    } catch (error) {
      console.error('[Stripe Webhook] Confirmation email failed:', error);
    }

    const adminEmail =
      process.env.ADMIN_ORDER_EMAIL ||
      process.env.CONTACT_TO_EMAIL ||
      process.env.ORDER_FROM_EMAIL;

    if (adminEmail) {
      try {
        await sendAdminOrderNotificationEmail({
          email: adminEmail,
          orderId: savedOrder.orderNumber,
          date: savedOrder.createdAt,
          customerName,
          customerEmail,
          shippingAddress: address,
          items: savedOrder.items,
          shippingTotal,
          total: amountTotal,
          device: session.metadata?.device || null,
        });
      } catch (error) {
        console.error('[Stripe Webhook] Admin notification failed:', error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Processing failed:', error);
    return NextResponse.json(
      { error: 'Error processing order' },
      { status: 500 }
    );
  }
}
