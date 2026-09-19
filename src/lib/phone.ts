import type { PaymentProvider } from '../types';

// Keep in sync with server/src/utils/phone.js — the server is the source of truth
const NETWORK_PREFIXES: Record<PaymentProvider, string[]> = {
  tigopesa: ['065', '067', '071', '077'],
  mpesa: ['074', '075', '076'],
  airtel: ['068', '069', '078'],
  halopesa: ['062', '061']
};

/** Accepts 0754…, 255754…, +255754…, 754… (spaces/dashes allowed) → `0XXXXXXXXX`, or null when invalid */
export const normalizePhone = (input: string): string | null => {
  let digits = input.replace(/[\s\-()]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;

  if (digits.startsWith('255') && digits.length === 12) digits = '0' + digits.slice(3);
  else if (digits.length === 9) digits = '0' + digits;

  return /^0[67]\d{8}$/.test(digits) ? digits : null;
};

export const detectProvider = (input: string): PaymentProvider | null => {
  const phone = normalizePhone(input);
  if (!phone) return null;

  const prefix = phone.slice(0, 3);
  const match = (Object.keys(NETWORK_PREFIXES) as PaymentProvider[])
    .find(provider => NETWORK_PREFIXES[provider].includes(prefix));
  return match ?? null;
};
