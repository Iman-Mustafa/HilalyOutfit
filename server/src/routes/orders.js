import { Router } from 'express';
import mongoose from 'mongoose';
import Order, { generateReference } from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { getPaymentDriver } from '../services/payments/index.js';
import { HttpError, validationError } from '../utils/httpError.js';
import { PROVIDERS, detectProvider, normalizePhone } from '../utils/phone.js';
import { serializeOrder } from '../utils/serialize.js';

const router = Router();

const ORDER_NOT_FOUND = 'Oda hii haipatikani.';
const REFERENCE_RE = /^HLY-TZ-\d{5}$/;

const text = (value) => (typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '');

/** Loads an order by its public reference; 404 unless the requester owns it or is admin. */
export async function findOrderForUser(referenceParam, user) {
  const reference = String(referenceParam).trim().toUpperCase();
  if (!REFERENCE_RE.test(reference)) throw new HttpError(404, ORDER_NOT_FOUND);
  const order = await Order.findOne({ reference });
  if (!order) throw new HttpError(404, ORDER_NOT_FOUND);
  if (user.role !== 'admin' && String(order.user) !== String(user._id)) throw new HttpError(404, ORDER_NOT_FOUND);
  return order;
}

async function createWithUniqueReference(data) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await Order.create({ ...data, reference: generateReference() });
    } catch (err) {
      const isReferenceCollision = err?.code === 11000 && 'reference' in (err.keyPattern || {});
      if (!isReferenceCollision) throw err;
    }
  }
  throw new HttpError(503, 'Imeshindikana kutengeneza namba ya oda. Tafadhali jaribu tena.');
}

router.use(requireAuth);

router.post('/', async (req, res) => {
  const body = req.body || {};
  const errors = {};

  // --- items ---
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const lines = [];
  if (rawItems.length < 1) errors.items = 'Kikapu chako kipo tupu.';
  else if (rawItems.length > 30) errors.items = 'Oda moja isizidi bidhaa 30 tofauti.';
  else {
    for (const raw of rawItems) {
      const isObject = raw && typeof raw === 'object';
      const productId = isObject ? text(raw.productId) : '';
      const quantity = isObject ? Number(text(raw.quantity)) : Number.NaN;
      if (!mongoose.isValidObjectId(productId)) {
        errors.items = 'Kuna bidhaa isiyotambulika kwenye kikapu chako.';
        break;
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        errors.items = 'Idadi ya kila bidhaa iwe kati ya 1 na 20.';
        break;
      }
      lines.push({
        productId,
        quantity,
        selectedSize: text(raw.selectedSize).slice(0, 80),
        selectedColor: text(raw.selectedColor).slice(0, 80),
      });
    }
  }

  // --- payment phone + provider ---
  const rawPhone = text(body.paymentPhone);
  const paymentPhone = normalizePhone(rawPhone);
  if (!rawPhone) errors.paymentPhone = 'Weka namba ya simu ya kulipia.';
  else if (!paymentPhone) errors.paymentPhone = 'Namba ya simu ya kulipia si sahihi. Mfano: 0712345678.';

  const requestedProvider = text(body.provider).toLowerCase();
  const provider = PROVIDERS.includes(requestedProvider) ? requestedProvider : detectProvider(paymentPhone);
  if (paymentPhone && !provider) errors.provider = 'Chagua mtandao wa malipo.';

  // --- delivery ---
  const deliveryLocation = text(body.deliveryLocation);
  if (deliveryLocation.length < 3 || deliveryLocation.length > 120) {
    errors.deliveryLocation = 'Weka mahali pa kupokelea mzigo (herufi 3 hadi 120).';
  }
  const deliveryNotes = text(body.deliveryNotes);
  if (deliveryNotes.length > 500) errors.deliveryNotes = 'Maelezo ya ziada yasizidi herufi 500.';

  if (Object.keys(errors).length > 0) throw validationError(errors);

  // --- prices ALWAYS come from the database; any price sent by the client is ignored ---
  const uniqueIds = [...new Set(lines.map((line) => line.productId))];
  const products = await Product.find({ _id: { $in: uniqueIds } });
  const byId = new Map(products.map((product) => [String(product._id), product]));

  const items = [];
  let amount = 0;
  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product) {
      throw new HttpError(
        400,
        'Bidhaa moja kwenye kikapu chako haipatikani tena. Tafadhali iondoe kisha ujaribu tena.',
        { items: 'Bidhaa haipatikani tena.' },
      );
    }
    if (!product.inStock) {
      throw new HttpError(400, `Samahani, "${product.name}" imeisha kwa sasa. Tafadhali iondoe kwenye kikapu.`, {
        items: `"${product.name}" imeisha.`,
      });
    }
    items.push({
      product: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      quantity: line.quantity,
      selectedSize: line.selectedSize,
      selectedColor: line.selectedColor,
    });
    amount += product.price * line.quantity;
  }

  const order = await createWithUniqueReference({
    user: req.user._id,
    customer: {
      fullName: req.user.name,
      phone: req.user.phone,
      email: '',
      region: '',
      district: deliveryLocation,
      deliveryNotes,
    },
    items,
    amount,
    currency: 'TZS',
    provider,
    paymentPhone,
    status: 'processing',
  });

  const driver = getPaymentDriver();
  try {
    const { gatewayRef } = await driver.initiate(order);
    order.gatewayRef = gatewayRef;
    await order.save();
  } catch (err) {
    order.status = 'failed';
    order.failureReason = err instanceof HttpError ? err.message : 'Imeshindikana kuanzisha malipo.';
    await order.save().catch(() => {});
    throw err;
  }

  res.status(201).json({ order: serializeOrder(order), simulated: driver.simulated });
});

router.get('/mine', async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1, _id: -1 }).limit(200);
  res.json({ orders: orders.map(serializeOrder) });
});

router.get('/:id', async (req, res) => {
  const order = await findOrderForUser(req.params.id, req.user);
  res.json({ order: serializeOrder(order) });
});

export default router;
