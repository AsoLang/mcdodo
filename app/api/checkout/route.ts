import { createCheckoutResponse } from '@/lib/checkout';

export async function POST(request: Request) {
  return createCheckoutResponse(request);
}
