import { createHash, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import Order, { OPEN_STATUSES } from '../models/Order.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { isSimulator } from '../services/payments/index.js';
import { HttpError, validationError } from '../utils/httpError.js';
import { serializeOrder } from '../utils/serialize.js';
import { findOrderForUser } from './orders.js';

const router = Router();

const text = (value) => (typeof value === 'string' ? value.trim() : '');

const SIMULATOR_OUTCOMES = new Map([
  ['approve', { status: 'successful', failureReason: undefined }],
  ['wrong_pin', { status: 'failed', failureReason: 'PIN si sahihi au salio halitoshi' }],
  ['cancel', { status: 'cancelled', failureReason: 'Muamala ulighairiwa na mteja' }],
]);

/**
 * Applies a payment result only while the order is still open. The status check
 * is part of the update filter, so two concurrent results cannot both win.
 * Returns the updated order, or null when the order was already settled.
 */
async function settleOrder(reference, { status, failureReason }) {
  const update = failureReason
    ? { $set: { status, failureReason } }
    : { $set: { status }, $unset: { failureReason: 1 } };
  return Order.findOneAndUpdate({ reference, status: { $in: OPEN_STATUSES } }, update, {
    returnDocument: 'after',
  });
}

// ---------- simulator (dev/demo only) ----------

router.post('/simulate/:id', requireAuth, async (req, res) => {
  if (!isSimulator()) throw new HttpError(404, 'Ulichokitafuta hakipatikani.');

  const order = await findOrderForUser(req.params.id, req.user);
  const outcome = SIMULATOR_OUTCOMES.get(text(req.body?.decision));
  if (!outcome) {
    throw validationError({ decision: 'Chagua: approve, wrong_pin au cancel.' }, 'Uamuzi wa malipo si sahihi.');
  }

  const updated = await settleOrder(order.reference, outcome);
  if (!updated) throw new HttpError(409, 'Malipo ya oda hii tayari yamekamilika. Hayawezi kubadilishwa tena.');

  res.json({ order: serializeOrder(updated) });
});

// ---------- webhook (future real gateway) ----------

function secretMatches(provided) {
  if (!env.PAYMENT_WEBHOOK_SECRET || !provided) return false;
  // Hash both sides so the buffers always have equal length for timingSafeEqual.
  const a = createHash('sha256').update(String(provided)).digest();
  const b = createHash('sha256').update(env.PAYMENT_WEBHOOK_SECRET).digest();
  return timingSafeEqual(a, b);
}

const WEBHOOK_STATUSES = ['successful', 'failed', 'cancelled'];

router.post('/webhook', async (req, res) => {
  // TODO(gateway): when a real aggregator is connected, replace/augment this shared-secret
  // check with its signature scheme (usually HMAC-SHA256 over the RAW request body).
  const provided = req.headers['x-webhook-secret'];
  if (!secretMatches(typeof provided === 'string' ? provided : '')) {
    throw new HttpError(401, 'Webhook haijathibitishwa.');
  }

  const reference = text(req.body?.reference).toUpperCase();
  const status = text(req.body?.status).toLowerCase();
  const reason = text(req.body?.reason).slice(0, 300);

  const errors = {};
  if (!/^HLY-TZ-\d{5}$/.test(reference)) errors.reference = 'Namba ya oda si sahihi.';
  if (!WEBHOOK_STATUSES.includes(status)) errors.status = 'Hali iwe: successful, failed au cancelled.';
  if (Object.keys(errors).length > 0) throw validationError(errors, 'Taarifa za webhook si sahihi.');

  const failureReason = status === 'successful' ? undefined : reason || 'Malipo hayakufanikiwa';
  const updated = await settleOrder(reference, { status, failureReason });
  if (updated) return res.json({ ok: true, changed: true, status: updated.status });

  // Idempotent: a repeated (or late) notification for a settled order is acknowledged, not re-applied.
  const existing = await Order.findOne({ reference }).select('status');
  if (!existing) throw new HttpError(404, 'Oda hii haipatikani.');
  res.json({ ok: true, changed: false, status: existing.status });
});

export default router;
