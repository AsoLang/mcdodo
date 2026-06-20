import { createCheckoutResponse } from '@/lib/checkout';

export async function POST(request: Request) {
  return createCheckoutResponse(request, {
    paymentMethodTypes: ['card'],
    source: 'legacy_checkout',
    successPath: '/success',
    cancelPath: '/checkout/cancel',
  });
}
