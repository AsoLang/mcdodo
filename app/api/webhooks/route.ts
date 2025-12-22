// app/api/webhooks/stripe/route.ts

import Stripe from "stripe";
import { Pool } from "pg";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function moneyFromCents(cents: number | null | undefined) {
  return Number(((cents ?? 0) / 100).toFixed(2));
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET or stripe-signature header" },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;

    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const email =
      session.customer_details?.email ??
      session.customer_email ??
      "unknown@example.com";

    const name =
      session.customer_details?.name ??
      (session.metadata?.customer_name as string | undefined) ??
      "Customer";

    const phone = session.customer_details?.phone ?? null;

    // Stripe typings vary; keep this type-safe
    const shippingDetails: any =
      "shipping_details" in session ? (session as any).shipping_details : null;

    const address: any = shippingDetails?.address ?? null;

    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
    });

    const items = (lineItems.data || []).map((li) => {
      const quantity = li.quantity ?? 1;
      const lineTotal = li.amount_total ?? li.amount_subtotal ?? 0;
      const unitPrice = quantity > 0 ? lineTotal / quantity : lineTotal;

      return {
        name: li.description ?? "Item",
        quantity,
        price: moneyFromCents(unitPrice),
      };
    });

    const subtotal = moneyFromCents(session.amount_subtotal);
    const total = moneyFromCents(session.amount_total);

    await pool.query(
      `
      INSERT INTO public.orders (
        stripe_session_id,
        stripe_payment_intent,
        customer_email,
        customer_name,
        customer_phone,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        items,
        subtotal,
        total,
        status,
        payment_status,
        fulfillment_status
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16
      )
      ON CONFLICT (stripe_session_id) DO NOTHING
      `,
      [
        sessionId,
        paymentIntent,
        email,
        name,
        phone,
        address?.line1 ?? null,
        address?.line2 ?? null,
        address?.city ?? null,
        address?.postal_code ?? null,
        address?.country ?? null,
        JSON.stringify(items),
        subtotal,
        total,
        "confirmed",
        "paid",
        "unfulfilled",
      ]
    );

    // Email sending disabled for now.
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Handler failed:", err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
