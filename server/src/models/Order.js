import { randomInt } from 'node:crypto';
import mongoose from 'mongoose';
import { PROVIDERS } from '../utils/phone.js';

export const ORDER_STATUSES = ['pending', 'processing', 'successful', 'failed', 'cancelled'];
/** Statuses from which a payment result may still be applied. */
export const OPEN_STATUSES = ['pending', 'processing'];

const itemSchema = new mongoose.Schema(
  {
    // Snapshot of the product at purchase time - later product edits never change past orders.
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    selectedSize: { type: String, default: '' },
    selectedColor: { type: String, default: '' },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: {
      fullName: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      region: { type: String, default: '' },
      district: { type: String, default: '' },
      deliveryNotes: { type: String, default: '' },
    },
    items: { type: [itemSchema], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'TZS', enum: ['TZS'] },
    provider: { type: String, required: true, enum: PROVIDERS },
    paymentPhone: { type: String, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    gatewayRef: { type: String },
    failureReason: { type: String },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });

export const generateReference = () => `HLY-TZ-${String(randomInt(0, 100000)).padStart(5, '0')}`;

export default mongoose.model('Order', orderSchema);
