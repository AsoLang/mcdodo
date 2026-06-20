export type DiscountResult =
  | {
      valid: true;
      code: string;
      discountAmount: number;
      type: 'percentage' | 'fixed';
      value: number;
    }
  | {
      valid: false;
      error: string;
    };

type DiscountConfig = {
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  active: boolean;
};

const DISCOUNT_CODES: Record<string, DiscountConfig> = {
  NEW10: {
    type: 'percentage',
    value: 10,
    active: true,
  },
  WELCOME20: {
    type: 'percentage',
    value: 20,
    minPurchase: 30,
    active: true,
  },
  SAVE5: {
    type: 'fixed',
    value: 5,
    active: true,
  },
  'FREESHIP-7X4K2': {
    type: 'fixed',
    value: 3.99,
    active: false,
  },
};

export function calculateDiscount(code: unknown, subtotal: number): DiscountResult {
  const normalizedCode =
    typeof code === 'string' ? code.trim().toUpperCase() : '';

  if (!normalizedCode) {
    return { valid: false, error: 'No code provided' };
  }

  const config = DISCOUNT_CODES[normalizedCode];
  if (!config) {
    return { valid: false, error: 'Invalid discount code' };
  }
  if (!config.active) {
    return { valid: false, error: 'This code has expired' };
  }
  if (config.minPurchase && subtotal < config.minPurchase) {
    return {
      valid: false,
      error: `Minimum purchase of £${config.minPurchase} required`,
    };
  }

  const rawAmount =
    config.type === 'percentage'
      ? (subtotal * config.value) / 100
      : config.value;
  const discountAmount = Math.max(
    0,
    Math.min(Number(rawAmount.toFixed(2)), subtotal)
  );

  return {
    valid: true,
    code: normalizedCode,
    discountAmount,
    type: config.type,
    value: config.value,
  };
}
