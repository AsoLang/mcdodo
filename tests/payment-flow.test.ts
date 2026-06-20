import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const sql = vi.fn();
  const couponCreate = vi.fn();
  const checkoutSessionCreate = vi.fn();
  const checkoutSessionRetrieve = vi.fn();
  const constructEvent = vi.fn();
  const clientQuery = vi.fn();
  const clientRelease = vi.fn();
  const poolConnect = vi.fn();
  const poolQuery = vi.fn();
  const sendOrderConfirmationEmail = vi.fn();
  const sendAdminOrderNotificationEmail = vi.fn();

  return {
    sql,
    couponCreate,
    checkoutSessionCreate,
    checkoutSessionRetrieve,
    constructEvent,
    clientQuery,
    clientRelease,
    poolConnect,
    poolQuery,
    sendOrderConfirmationEmail,
    sendAdminOrderNotificationEmail,
  };
});

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mocks.sql),
}));

vi.mock('stripe', () => ({
  default: class StripeMock {
    coupons = { create: mocks.couponCreate };
    checkout = {
      sessions: {
        create: mocks.checkoutSessionCreate,
        retrieve: mocks.checkoutSessionRetrieve,
      },
    };
    webhooks = { constructEvent: mocks.constructEvent };
  },
}));

vi.mock('pg', () => ({
  Pool: class PoolMock {
    connect = mocks.poolConnect;
    query = mocks.poolQuery;
  },
}));

vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: mocks.sendOrderConfirmationEmail,
  sendAdminOrderNotificationEmail: mocks.sendAdminOrderNotificationEmail,
}));

process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
process.env.NEXT_PUBLIC_BASE_URL = 'https://checkout.mcdodo.test';
process.env.ADMIN_ORDER_EMAIL = 'admin@mcdodo.test';

type CheckoutModule = typeof import('@/lib/checkout');
type WebhookModule = typeof import('@/app/api/webhooks/stripe/route');

let checkoutModule: CheckoutModule;
let webhookModule: WebhookModule;

const databaseVariant = {
  variant_id: 'variant-1',
  product_id: 'product-1',
  title: 'Database Product',
  product_url: 'database-product',
  sku: 'SKU-1',
  color: 'Black',
  size: '1m',
  price: '12.50',
  sale_price: null,
  on_sale: false,
  stock: 10,
  images: ['/trusted-product.jpg'],
};

function requestJson(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://attacker.example/api/checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://attacker.example',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function webhookRequest() {
  return new Request('https://checkout.mcdodo.test/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'valid-signature' },
    body: '{"type":"checkout.session.completed"}',
  });
}

function paidStripeSession() {
  return {
    id: 'cs_test_paid',
    payment_status: 'paid',
    amount_total: 1649,
    customer_email: null,
    customer_details: {
      email: 'customer@example.com',
      name: 'Customer',
      address: {
        line1: '1 Test Street',
        line2: null,
        city: 'London',
        postal_code: 'SW1A 1AA',
        country: 'GB',
      },
    },
    metadata: { device: 'desktop' },
    total_details: { amount_shipping: 0 },
    line_items: {
      data: [
        {
          quantity: 1,
          amount_total: 1250,
          description: 'Database Product',
          price: {
            product: {
              id: 'prod_stripe_1',
              name: 'Database Product',
              metadata: {
                variantId: 'variant-1',
                productId: 'product-1',
                color: 'Black',
                size: '1m',
              },
            },
          },
        },
        {
          quantity: 1,
          amount_total: 399,
          description: 'Shipping',
          price: {
            product: {
              id: 'prod_shipping',
              name: 'Shipping',
              metadata: { isShipping: 'true' },
            },
          },
        },
      ],
    },
  };
}

beforeAll(async () => {
  checkoutModule = await import('@/lib/checkout');
  webhookModule = await import('@/app/api/webhooks/stripe/route');
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.poolConnect.mockResolvedValue({
    query: mocks.clientQuery,
    release: mocks.clientRelease,
  });
  mocks.checkoutSessionCreate.mockResolvedValue({
    url: 'https://checkout.stripe.test/session',
  });
  mocks.couponCreate.mockResolvedValue({ id: 'coupon-test' });
  mocks.poolQuery.mockResolvedValue({ rowCount: 1, rows: [] });
});

describe('checkout creation', () => {
  it('ignores tampered browser prices, titles, shipping, and origin', async () => {
    mocks.sql.mockResolvedValueOnce([databaseVariant]);

    const response = await checkoutModule.createCheckoutResponse(
      requestJson({
        items: [
          {
            id: 'variant-1',
            quantity: 1,
            title: 'Attacker Product',
            price: 0.01,
            salePrice: 0.01,
            onSale: true,
          },
        ],
        shippingCost: 0,
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: 'https://checkout.stripe.test/session',
    });

    const session = mocks.checkoutSessionCreate.mock.calls[0][0];
    expect(session.line_items).toHaveLength(2);
    expect(session.line_items[0].price_data.unit_amount).toBe(1250);
    expect(session.line_items[0].price_data.product_data.name).toBe(
      'Database Product'
    );
    expect(session.line_items[0].price_data.product_data.metadata.variantId).toBe(
      'variant-1'
    );
    expect(session.line_items[1].price_data.unit_amount).toBe(399);
    expect(session.success_url).toBe(
      'https://checkout.mcdodo.test/success?session_id={CHECKOUT_SESSION_ID}'
    );
    expect(session.cancel_url).toBe('https://checkout.mcdodo.test/');
    expect(JSON.stringify(session)).not.toContain('Attacker Product');
    expect(JSON.stringify(session)).not.toContain('attacker.example');
  });

  it('calculates discounts from the database subtotal and removes shipping over £20', async () => {
    mocks.sql.mockResolvedValueOnce([databaseVariant]);

    const response = await checkoutModule.createCheckoutResponse(
      requestJson({
        items: [{ id: 'variant-1', quantity: 2, price: 0.01 }],
        discountCode: 'new10',
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.couponCreate).toHaveBeenCalledWith({
      amount_off: 250,
      currency: 'gbp',
      duration: 'once',
      name: 'Code: NEW10',
    });

    const session = mocks.checkoutSessionCreate.mock.calls[0][0];
    expect(session.line_items).toHaveLength(1);
    expect(session.line_items[0].quantity).toBe(2);
    expect(session.line_items[0].price_data.unit_amount).toBe(1250);
    expect(session.discounts).toEqual([{ coupon: 'coupon-test' }]);
  });

  it('blocks unavailable stock before creating a Stripe session', async () => {
    mocks.sql.mockResolvedValueOnce([{ ...databaseVariant, stock: 1 }]);

    const response = await checkoutModule.createCheckoutResponse(
      requestJson({ items: [{ id: 'variant-1', quantity: 2 }] })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      code: 'STOCK_CHANGED',
      issues: [{ id: 'variant-1', requested: 2, available: 1 }],
    });
    expect(mocks.checkoutSessionCreate).not.toHaveBeenCalled();
  });

  it('rejects malformed quantities before querying the database', async () => {
    const response = await checkoutModule.createCheckoutResponse(
      requestJson({ items: [{ id: 'variant-1', quantity: -1 }] })
    );

    expect(response.status).toBe(400);
    expect(mocks.sql).not.toHaveBeenCalled();
    expect(mocks.checkoutSessionCreate).not.toHaveBeenCalled();
  });
});

describe('Stripe webhook processing', () => {
  it('rejects an invalid Stripe signature before touching the database', async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await webhookModule.POST(webhookRequest() as never);

    expect(response.status).toBe(400);
    expect(mocks.checkoutSessionRetrieve).not.toHaveBeenCalled();
    expect(mocks.poolConnect).not.toHaveBeenCalled();
  });

  it('does not create an order or decrement stock for an unpaid session', async () => {
    mocks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_unpaid' } },
    });
    mocks.checkoutSessionRetrieve.mockResolvedValue({
      id: 'cs_test_unpaid',
      payment_status: 'unpaid',
    });

    const response = await webhookModule.POST(webhookRequest() as never);

    expect(response.status).toBe(200);
    expect(mocks.poolConnect).not.toHaveBeenCalled();
    expect(mocks.sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  it('atomically records a paid order and decrements its real variant stock', async () => {
    mocks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_paid' } },
    });
    mocks.checkoutSessionRetrieve.mockResolvedValue(paidStripeSession());

    mocks.clientQuery.mockImplementation(async (query: string) => {
      const normalized = query.replace(/\s+/g, ' ').trim();
      if (normalized === 'BEGIN' || normalized === 'COMMIT') {
        return { rowCount: null, rows: [] };
      }
      if (normalized.includes('pg_advisory_xact_lock')) {
        return { rowCount: 1, rows: [{}] };
      }
      if (normalized.includes('SELECT order_number')) {
        return { rowCount: 0, rows: [] };
      }
      if (normalized.includes('SELECT pv.id::text AS variant_id')) {
        return {
          rowCount: 1,
          rows: [{ variant_id: 'variant-1', product_url: 'database-product' }],
        };
      }
      if (normalized.startsWith('UPDATE product_variants')) {
        return { rowCount: 1, rows: [{ product_id: 'product-1' }] };
      }
      if (normalized.startsWith('UPDATE products')) {
        return { rowCount: 1, rows: [] };
      }
      if (normalized.startsWith('INSERT INTO orders')) {
        return {
          rowCount: 1,
          rows: [{ order_number: 1001, created_at: new Date('2026-06-20') }],
        };
      }
      throw new Error(`Unexpected query: ${normalized}`);
    });

    const response = await webhookModule.POST(webhookRequest() as never);

    expect(response.status).toBe(200);
    const statements = mocks.clientQuery.mock.calls.map(([query]) =>
      String(query).replace(/\s+/g, ' ').trim()
    );
    expect(statements[0]).toBe('BEGIN');
    expect(statements).toContain(
      'SELECT pg_advisory_xact_lock(hashtext($1))'
    );
    expect(statements.some((query) => query.startsWith('UPDATE product_variants'))).toBe(true);
    expect(statements.some((query) => query.startsWith('UPDATE products'))).toBe(true);
    expect(statements.some((query) => query.startsWith('INSERT INTO orders'))).toBe(true);
    expect(statements.at(-1)).toBe('COMMIT');

    const stockCall = mocks.clientQuery.mock.calls.find(([query]) =>
      String(query).includes('UPDATE product_variants')
    );
    expect(stockCall?.[1]).toEqual([1, 'variant-1']);

    const insertCall = mocks.clientQuery.mock.calls.find(([query]) =>
      String(query).includes('INSERT INTO orders')
    );
    expect(insertCall?.[1][0]).toBe('cs_test_paid');
    expect(insertCall?.[1][3]).toBe(16.49);
    expect(JSON.parse(insertCall?.[1][4])).toEqual([
      expect.objectContaining({
        variant_id: 'variant-1',
        quantity: 1,
        price: 12.5,
        product_url: 'database-product',
      }),
    ]);

    expect(mocks.sendOrderConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'customer@example.com',
        orderId: '1001',
        shippingTotal: 3.99,
        total: 16.49,
      })
    );
    expect(mocks.sendAdminOrderNotificationEmail).toHaveBeenCalledTimes(1);
    expect(mocks.clientRelease).toHaveBeenCalledTimes(1);
  });

  it('treats a repeated Stripe event as idempotent and does not decrement twice', async () => {
    mocks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_paid' } },
    });
    mocks.checkoutSessionRetrieve.mockResolvedValue(paidStripeSession());
    mocks.clientQuery.mockImplementation(async (query: string) => {
      const normalized = query.replace(/\s+/g, ' ').trim();
      if (normalized === 'BEGIN' || normalized === 'COMMIT') {
        return { rowCount: null, rows: [] };
      }
      if (normalized.includes('pg_advisory_xact_lock')) {
        return { rowCount: 1, rows: [{}] };
      }
      if (normalized.includes('SELECT order_number')) {
        return {
          rowCount: 1,
          rows: [{ order_number: 1001, created_at: new Date('2026-06-20') }],
        };
      }
      throw new Error(`Unexpected query: ${normalized}`);
    });

    const response = await webhookModule.POST(webhookRequest() as never);

    expect(response.status).toBe(200);
    expect(
      mocks.clientQuery.mock.calls.some(([query]) =>
        String(query).includes('UPDATE product_variants')
      )
    ).toBe(false);
    expect(
      mocks.clientQuery.mock.calls.some(([query]) =>
        String(query).includes('INSERT INTO orders')
      )
    ).toBe(false);
    expect(mocks.sendOrderConfirmationEmail).not.toHaveBeenCalled();
    expect(mocks.sendAdminOrderNotificationEmail).not.toHaveBeenCalled();
  });

  it('rolls back the transaction if stock/order persistence fails', async () => {
    mocks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_paid' } },
    });
    mocks.checkoutSessionRetrieve.mockResolvedValue(paidStripeSession());
    mocks.clientQuery.mockImplementation(async (query: string) => {
      const normalized = query.replace(/\s+/g, ' ').trim();
      if (
        normalized === 'BEGIN' ||
        normalized === 'ROLLBACK' ||
        normalized.includes('pg_advisory_xact_lock')
      ) {
        return { rowCount: 1, rows: [] };
      }
      if (normalized.includes('SELECT order_number')) {
        return { rowCount: 0, rows: [] };
      }
      if (normalized.includes('SELECT pv.id::text AS variant_id')) {
        return {
          rowCount: 1,
          rows: [{ variant_id: 'variant-1', product_url: 'database-product' }],
        };
      }
      if (normalized.startsWith('UPDATE product_variants')) {
        return { rowCount: 0, rows: [] };
      }
      throw new Error(`Unexpected query: ${normalized}`);
    });

    const response = await webhookModule.POST(webhookRequest() as never);

    expect(response.status).toBe(500);
    expect(
      mocks.clientQuery.mock.calls.some(
        ([query]) => String(query).trim() === 'ROLLBACK'
      )
    ).toBe(true);
    expect(mocks.sendOrderConfirmationEmail).not.toHaveBeenCalled();
    expect(mocks.clientRelease).toHaveBeenCalledTimes(1);
  });
});
