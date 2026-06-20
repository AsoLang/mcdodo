import { createCheckoutResponse } from '@/lib/checkout';

export async function POST(request: Request) {
  return createCheckoutResponse(request, {
    paymentMethodTypes: ['card'],
    source: 'apple_pay_quick_buy',
  });
}
