// Tanzanian mobile number helpers.

export const PROVIDERS = ['tigopesa', 'mpesa', 'airtel', 'halopesa'];

const PREFIXES = {
  tigopesa: ['065', '067', '071', '077'],
  mpesa: ['074', '075', '076'],
  airtel: ['068', '069', '078'],
  halopesa: ['062', '061'],
};

const LOCAL_RE = /^0[67]\d{8}$/;

/**
 * Accepts `0XXXXXXXXX`, `255XXXXXXXXX`, `+255XXXXXXXXX` or `XXXXXXXXX`
 * (with spaces/dashes) and returns the local form `0XXXXXXXXX`.
 * Returns '' when the input cannot be a Tanzanian mobile number.
 */
export function normalizePhone(input) {
  if (typeof input !== 'string' && typeof input !== 'number') return '';
  let digits = String(input).trim().replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return '';

  let local = '';
  if (digits.length === 12 && digits.startsWith('255')) local = `0${digits.slice(3)}`;
  else if (digits.length === 10 && digits.startsWith('0')) local = digits;
  else if (digits.length === 9 && /^[67]/.test(digits)) local = `0${digits}`;

  return LOCAL_RE.test(local) ? local : '';
}

export function isValidPhone(phone) {
  return typeof phone === 'string' && LOCAL_RE.test(phone);
}

/** Expects a normalized phone. Returns a provider id or null. */
export function detectProvider(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const prefix = normalized.slice(0, 3);
  for (const provider of PROVIDERS) {
    if (PREFIXES[provider].includes(prefix)) return provider;
  }
  return null;
}
