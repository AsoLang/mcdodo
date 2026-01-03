// Path: app/api/checkout/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

type CartItem = {
  id?: string | number;
  title: string;
  price: number;
  quantity: number;
  onSale?: boolean;
  salePrice?: number;
  image?: string;
  color?: string;
  size?: string;
};

export async function POST(req: Request) {
  try {
    const { items, shippingCost, discountCode } = (await req.json()) as {
      items: CartItem[];
      shippingCost?: number;
      discountCode?: string;
    };

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    // 1) Calculate subtotal (using the same prices you show in-cart)
    const subtotal = items.reduce((sum: number, item: CartItem) => {
      const price = item.onSale ? (item.salePrice ?? item.price) : item.price;
      return sum + price * item.quantity;
    }, 0);

    // 2) Validate discount code and (if valid) create a one-time Stripe coupon
    let stripeCouponId: string | undefined = undefined;
    let discountAmount = 0;
    let discountPercent = 0;
    const normalizedCode = (discountCode || '').trim().toUpperCase();

    if (normalizedCode) {
      try {
        const discountRes = await fetch(`${origin}/api/validate-discount`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: normalizedCode, subtotal }),
        });

        if (discountRes.ok) {
          const discountData = await discountRes.json();

          if (discountData?.valid && discountData?.discountAmount > 0) {
            discountAmount = Number(discountData.discountAmount);
            discountPercent = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;

            // Creates a coupon so Stripe shows an explicit discount line like "-£1.30"
            // Note: This will create lots of coupons over time. Works as a drop-in fix.
            const coupon = await stripe.coupons.create({
              amount_off: Math.round(discountAmount * 100),
              currency: 'gbp',
              duration: 'once',
              name: `Code: ${normalizedCode}`,
            });

            stripeCouponId = coupon.id;
          }
        }
      } catch (error) {
        console.error('Discount validation / coupon creation failed:', error);
      }
    }

    // 3) Create line items (keep ORIGINAL unit prices; coupon handles discount)
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      (item: CartItem) => {
        const unitPrice = item.onSale ? (item.salePrice ?? item.price) : item.price;

        const descriptionText = [item.color, item.size].filter(Boolean).join(', ');

        const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData =
          {
            name: item.title,
            images: item.image ? [item.image] : [],
            ...(descriptionText ? { description: descriptionText } : {}),
          };

        return {
          price_data: {
            currency: 'gbp',
            product_data: productData,
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity: item.quantity,
        };
      }
    );

    // 4) Add shipping line item (optional) — also tag it so code appears in summary list
    if (shippingCost && shippingCost > 0) {
      const shippingName =
        stripeCouponId && normalizedCode
          ? `Shipping (Code: ${normalizedCode})`
          : 'Shipping';

      line_items.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: shippingName,
            description: 'Standard Delivery',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // 5) Create Stripe Checkout session
    // ✅ Most reliable way to visibly show the code on hosted Checkout:
    // custom_text.submit.message (renders near the Pay button)
    const discountLabel =
      stripeCouponId && normalizedCode
        ? `Discount applied: ${normalizedCode}`
        : undefined;

    // CHANGED: Type is 'any' to fix red line.
    // CHANGED: Used automatic methods + currency to fix mobile PayPal.
    const sessionParams: any = {
      automatic_payment_methods: { enabled: true },
      currency: 'gbp',
      line_items,
      mode: 'payment',

      shipping_address_collection: {
        allowed_countries: ['GB'],
      },

      // ✅ Shows on Checkout UI
      ...(discountLabel
        ? {
            custom_text: {
              submit: {
                message: discountLabel,
              },
            },
          }
        : {}),

      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    };

    // Apply coupon discount if valid
    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}