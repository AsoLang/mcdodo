import { neon } from '@neondatabase/serverless';
import Stripe from 'stripe';
import { calculateDiscount } from '@/lib/discounts';
import { getSiteUrl } from '@/lib/site-url';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const sql = neon(process.env.DATABASE_URL!);

const FREE_SHIPPING_THRESHOLD = 20;
const SHIPPING_COST = 3.99;
const MAX_DISTINCT_ITEMS = 50;
const MAX_QUANTITY_PER_ITEM = 20;

type CheckoutRequestItem = {
  id?: unknown;
  variantId?: unknown;
  quantity?: unknown;
};

type CheckoutOptions = {
  paymentMethodTypes?: Stripe.Checkout.SessionCreateParams.PaymentMethodType[];
  source?: string;
  successPath?: string;
  cancelPath?: string;
};

type VariantRow = {
  variant_id: string;
  product_id: string;
  title: string;
  product_url: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  price: string | number;
  sale_price: string | number | null;
  on_sale: boolean;
  stock: string | number;
  images: string[] | null;
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function parseItems(value: unknown):
  | { items: Array<{ id: string; quantity: number }> }
  | { error: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { error: 'No items provided' };
  }
  if (value.length > MAX_DISTINCT_ITEMS) {
    return { error: 'Too many items in one checkout' };
  }

  const quantities = new Map<string, number>();
  for (const rawItem of value as CheckoutRequestItem[]) {
    const rawId = rawItem?.id ?? rawItem?.variantId;
    const id = typeof rawId === 'string' ? rawId.trim() : String(rawId ?? '').trim();
    const quantity = Number(rawItem?.quantity);

    if (!id || !Number.isInteger(quantity) || quantity < 1) {
      return { error: 'Invalid cart item' };
    }

    const combinedQuantity = (quantities.get(id) || 0) + quantity;
    if (combinedQuantity > MAX_QUANTITY_PER_ITEM) {
      return { error: `Maximum quantity per item is ${MAX_QUANTITY_PER_ITEM}` };
    }
    quantities.set(id, combinedQuantity);
  }

  return {
    items: Array.from(quantities, ([id, quantity]) => ({ id, quantity })),
  };
}

function absoluteImageUrl(image: string | undefined, siteUrl: string): string | null {
  if (!image) return null;

  try {
    const url = new URL(image, siteUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function createCheckoutResponse(
  request: Request,
  options: CheckoutOptions = {}
): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = parseItems(body?.items);
    if ('error' in parsed) {
      return json({ error: parsed.error }, 400);
    }

    const variantIds = parsed.items.map((item) => item.id);
    const rows = (await sql`
      SELECT
        pv.id::text AS variant_id,
        pv.product_id::text AS product_id,
        pv.sku,
        pv.color,
        pv.size,
        pv.price,
        pv.sale_price,
        pv.on_sale,
        pv.stock,
        pv.images,
        p.title,
        p.product_url
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE pv.id::text = ANY(${variantIds})
    `) as VariantRow[];

    const rowById = new Map(rows.map((row) => [String(row.variant_id), row]));
    const issues = parsed.items.flatMap((item) => {
      const row = rowById.get(item.id);
      const available = row ? Math.max(0, Number(row.stock) || 0) : 0;
      if (row && item.quantity <= available) return [];
      return [{
        id: item.id,
        title: row?.title || 'Unavailable item',
        requested: item.quantity,
        available,
      }];
    });

    if (issues.length > 0) {
      return json(
        {
          error: 'Some items in your basket are no longer available in that quantity.',
          code: 'STOCK_CHANGED',
          issues,
        },
        409
      );
    }

    const siteUrl = getSiteUrl();
    let subtotal = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      parsed.items.map((item) => {
        const row = rowById.get(item.id)!;
        const regularPrice = Number(row.price);
        const salePrice = Number(row.sale_price);
        const unitPrice =
          row.on_sale &&
          row.sale_price !== null &&
          row.sale_price !== '' &&
          Number.isFinite(salePrice) &&
          salePrice >= 0
            ? salePrice
            : regularPrice;

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new Error(`Invalid configured price for variant ${item.id}`);
        }

        subtotal += unitPrice * item.quantity;
        const imageUrl = absoluteImageUrl(row.images?.[0], siteUrl);
        const description = [row.color, row.size].filter(Boolean).join(', ');

        return {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: row.title,
              ...(description ? { description } : {}),
              ...(imageUrl ? { images: [imageUrl] } : {}),
              metadata: {
                variantId: row.variant_id,
                productId: row.product_id,
                ...(row.sku ? { sku: row.sku } : {}),
                ...(row.color ? { color: row.color } : {}),
                ...(row.size ? { size: row.size } : {}),
              },
            },
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity: item.quantity,
        };
      });

    const shippingCost =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Shipping',
            description: 'Standard Delivery',
            metadata: { isShipping: 'true' },
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    let couponId: string | undefined;
    const requestedDiscountCode =
      typeof body?.discountCode === 'string' ? body.discountCode.trim() : '';

    if (requestedDiscountCode) {
      const discount = calculateDiscount(requestedDiscountCode, subtotal);
      if (!discount.valid) {
        return json({ error: discount.error }, 400);
      }

      if (discount.discountAmount > 0) {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(discount.discountAmount * 100),
          currency: 'gbp',
          duration: 'once',
          name: `Code: ${discount.code}`,
        });
        couponId = coupon.id;
      }
    }

    const device = /mobile|android|iphone|ipad|tablet/i.test(
      request.headers.get('user-agent') || ''
    )
      ? 'mobile'
      : 'desktop';
    const successPath = options.successPath || '/success';
    const cancelPath = options.cancelPath || '/';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: options.paymentMethodTypes || ['card', 'paypal'],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      success_url: `${siteUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}${cancelPath}`,
      ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
      metadata: {
        device,
        source: options.source || 'cart',
        ...(requestedDiscountCode
          ? { discount_code: requestedDiscountCode.toUpperCase() }
          : {}),
      },
    });

    return json({ url: session.url });
  } catch (error) {
    console.error('[Checkout] Failed:', error);
    return json({ error: 'Failed to create checkout session' }, 500);
  }
}
