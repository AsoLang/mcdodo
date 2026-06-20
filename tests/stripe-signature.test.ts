import { describe, expect, it } from 'vitest';
import Stripe from 'stripe';

describe('Stripe SDK webhook signatures', () => {
  it('accepts a correctly signed payload and rejects a forged signature', () => {
    const stripe = new Stripe('sk_test_mock');
    const secret = 'whsec_test_secret';
    const payload = JSON.stringify({
      id: 'evt_test',
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_paid' } },
    });
    const validHeader = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });

    const event = stripe.webhooks.constructEvent(
      payload,
      validHeader,
      secret
    );
    expect(event.type).toBe('checkout.session.completed');

    expect(() =>
      stripe.webhooks.constructEvent(
        payload,
        't=123,v1=forged',
        secret
      )
    ).toThrow();
  });
});
