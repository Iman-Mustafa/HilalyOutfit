import mongoose from 'mongoose';
import { CATEGORIES } from '../utils/serialize.js';

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Jina la rangi linahitajika.'], trim: true, maxlength: 60 },
    hex: {
      type: String,
      required: [true, 'Msimbo wa rangi (hex) unahitajika.'],
      trim: true,
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Msimbo wa rangi uwe kama #D4AF37.'],
    },
  },
  { _id: false },
);

const intValidator = { validator: Number.isInteger, message: 'Bei iwe namba kamili ya TZS.' };

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Jina la bidhaa linahitajika.'],
      trim: true,
      minlength: [2, 'Jina la bidhaa liwe na angalau herufi 2.'],
      maxlength: [140, 'Jina la bidhaa lisizidi herufi 140.'],
    },
    category: {
      type: String,
      required: [true, 'Chagua kundi la bidhaa.'],
      enum: { values: CATEGORIES, message: 'Kundi la bidhaa si sahihi.' },
    },
    price: {
      type: Number,
      required: [true, 'Bei inahitajika.'],
      min: [1, 'Bei iwe kubwa kuliko sifuri.'],
      validate: intValidator,
    },
    originalPrice: { type: Number, min: [1, 'Bei ya awali iwe kubwa kuliko sifuri.'], validate: intValidator },
    description: { type: String, default: '', trim: true, maxlength: [2000, 'Maelezo yasizidi herufi 2000.'] },
    image: { type: String, required: [true, 'Picha ya bidhaa inahitajika.'], trim: true },
    images: { type: [String], default: [] },
    imagePublicId: { type: String },
    sizes: { type: [String], default: [] },
    colors: { type: [colorSchema], default: [] },
    inStock: { type: Boolean, default: true },
    rating: { type: Number, default: 5, min: [0, 'Rating iwe kati ya 0 na 5.'], max: [5, 'Rating iwe kati ya 0 na 5.'] },
    reviewsCount: { type: Number, default: 0, min: [0, 'Idadi ya maoni haiwezi kuwa hasi.'] },
    badge: { type: String, trim: true, maxlength: [40, 'Badge isizidi herufi 40.'] },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ name: 'text', description: 'text' }, { default_language: 'none' });

export default mongoose.model('Product', productSchema);
