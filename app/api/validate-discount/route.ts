import { NextResponse } from 'next/server';
import { calculateDiscount } from '@/lib/discounts';

export async function POST(request: Request) {
  try {
    const { code, subtotal } = await request.json();
    const numericSubtotal = Number(subtotal);

    if (!Number.isFinite(numericSubtotal) || numericSubtotal < 0) {
      return NextResponse.json(
        { valid: false, error: 'Invalid subtotal' },
        { status: 400 }
      );
    }

    const result = calculateDiscount(code, numericSubtotal);
    return NextResponse.json(result, { status: result.valid ? 200 : 400 });
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Failed to validate code' },
      { status: 400 }
    );
  }
}
