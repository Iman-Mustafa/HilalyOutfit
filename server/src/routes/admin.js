import { Router } from 'express';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { HttpError, validationError } from '../utils/httpError.js';
import { serializeOrder } from '../utils/serialize.js';

const router = Router();

router.use(requireAuth, requireAdmin);

const text = (value) => (typeof value === 'string' ? value.trim() : '');

router.get('/orders', async (req, res) => {
  const status = text(req.query?.status).toLowerCase();
  const filter = ORDER_STATUSES.includes(status) ? { status } : {};
  const orders = await Order.find(filter).sort({ createdAt: -1, _id: -1 }).limit(500);
  res.json({ orders: orders.map(serializeOrder) });
});

router.post('/orders/:id/status', async (req, res) => {
  const reference = String(req.params.id).trim().toUpperCase();
  const status = text(req.body?.status).toLowerCase();
  const note = text(req.body?.note).slice(0, 300);

  if (!ORDER_STATUSES.includes(status)) {
    throw validationError({ status: 'Chagua hali sahihi ya oda.' }, 'Hali ya oda si sahihi.');
  }

  const order = /^HLY-TZ-\d{5}$/.test(reference) ? await Order.findOne({ reference }) : null;
  if (!order) throw new HttpError(404, 'Oda hii haipatikani.');

  order.status = status;
  order.failureReason = (status === 'failed' || status === 'cancelled') && note ? note : undefined;
  await order.save();

  res.json({ order: serializeOrder(order) });
});

router.get('/stats', async (_req, res) => {
  const [byStatus, customers, products] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({}),
  ]);

  const count = (status) => byStatus.find((row) => row._id === status)?.count || 0;
  res.json({
    revenue: byStatus.find((row) => row._id === 'successful')?.amount || 0,
    successful: count('successful'),
    pending: count('pending') + count('processing'),
    failed: count('failed') + count('cancelled'),
    customers,
    products,
  });
});

export default router;
