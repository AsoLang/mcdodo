import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});
const sql = neon(process.env.DATABASE_URL!);

const PRODUCT_SLUG = 'chargeguard-kh-51';
const FALLBACK_TITLE = 'Mcdodo (UK) ChargeGuard 140W Auto-Off Adapter';
const FALLBACK_PRICE = 29.99;
const FALLBACK_IMAGE = '/media/nop/holding-product-in-hand%20(1).png';

function detectDevice(ua: string | null): 'mobile' | 'desktop' {
  return /mobile|android|iphone|ipad|tablet/i.test(ua || '') ? 'mobile' : 'desktop';
}

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const device = detectDevice(req.headers.get('user-agent'));
    const body = await req.json().catch(() => ({}));
    const quantity = Math.max(1, Math.min(10, Number(body?.quantity || 1)));

    const rows = await sql`
      SELECT
        p.id AS product_id,
        p.title,
        p.product_url,
        pv.id AS variant_id,
        pv.price,
        pv.sale_price,
        pv.on_sale,
        pv.stock,
        pv.images
      FROM products p
      LEFT JOIN LATERAL (
        SELECT *
        FROM product_variants
        WHERE product_id = p.id
        ORDER BY (stock > 0) DESC, position ASC NULLS LAST, id ASC
        LIMIT 1
      ) pv ON true
      WHERE p.product_url = ${PRODUCT_SLUG}
      AND p.visible = true
      LIMIT 1
    `;

    const product = rows[0];
    const available = Number(product?.stock || 0);

    if (!product || !product.variant_id || available < quantity) {
      return NextResponse.json(
        {
          error: available > 0
            ? `Only ${available} left in stock.`
            : 'This product is not available yet.',
          code: 'STOCK_CHANGED',
          available,
        },
        { status: 409 }
      );
    }

    const unitPrice = product.on_sale
      ? Number(product.sale_price || product.price || FALLBACK_PRICE)
      : Number(product.price || FALLBACK_PRICE);
    const imagePath = Array.isArray(product.images) && product.images[0]
      ? product.images[0]
      : FALLBACK_IMAGE;
    const imageUrl = encodeURI(imagePath.startsWith('http')
      ? imagePath
      : `${origin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`);
    const subtotal = unitPrice * quantity;
    const shippingCost = subtotal >= 20 ? 0 : 3.99;

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: product.title || FALLBACK_TITLE,
            images: [imageUrl],
            metadata: {
              productId: String(product.product_id),
              variantId: String(product.variant_id),
            },
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity,
      },
    ];

    if (shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Shipping',
            description: 'Standard Delivery',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal'],
      line_items,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/nop-landing.html`,
      metadata: {
        device,
        source: 'chargeguard_landing',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[ChargeGuard Checkout] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout session' }, { status: 500 });
  }
}
