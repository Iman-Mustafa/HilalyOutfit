import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { uploadProductImage } from '../middleware/upload.js';
import { cloudinaryEnabled, uploadImageBuffer, destroyImage } from '../config/cloudinary.js';
import { HttpError, validationError } from '../utils/httpError.js';
import { CATEGORIES, serializeProduct } from '../utils/serialize.js';

const router = Router();

const NOT_FOUND = 'Bidhaa hii haipatikani.';
const CLOUDINARY_OFF =
  'Cloudinary haijasanidiwa. Weka CLOUDINARY_* kwenye server/.env au tumia kiungo cha picha.';
const SORT = { featured: -1, createdAt: -1, _id: -1 };

// ---------- input helpers (every user-supplied value is coerced to a scalar) ----------

const has = (body, key) => body[key] !== undefined && body[key] !== null;
const text = (value) => (typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isHttpUrl = (value) => /^https?:\/\/[^\s]+$/i.test(value) && value.length <= 2000;

function toBool(value) {
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'on', 'yes', 'ndiyo'].includes(text(value).toLowerCase());
}

/** Accepts a real array, a JSON array string, or a comma-separated string. */
function toStringList(value) {
  let list = value;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return [];
    if (raw.startsWith('[')) {
      try {
        list = JSON.parse(raw);
      } catch {
        return null;
      }
    } else {
      list = raw.split(',');
    }
  }
  if (!Array.isArray(list)) return null;
  return list
    .filter((item) => typeof item === 'string' || typeof item === 'number')
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 40);
}

/** Accepts a real array or a JSON array string of { name, hex }. */
function toColors(value) {
  let list = value;
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return [];
    try {
      list = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(list)) return null;
  const colors = [];
  for (const item of list.slice(0, 20)) {
    if (!item || typeof item !== 'object') return null;
    const name = text(item.name);
    const hex = text(item.hex);
    if (!name || !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) return null;
    colors.push({ name, hex });
  }
  return colors;
}

/**
 * Reads the product fields present in the body into `data` (only keys that were
 * sent, so the same function serves create and partial update).
 */
function readProductFields(body, { partial }) {
  const data = {};
  const unset = [];
  const errors = {};

  if (!partial || has(body, 'name')) {
    data.name = text(body.name);
    if (data.name.length < 2 || data.name.length > 140) errors.name = 'Jina la bidhaa liwe na herufi 2 hadi 140.';
  }
  if (!partial || has(body, 'category')) {
    data.category = text(body.category);
    if (!CATEGORIES.includes(data.category)) errors.category = 'Chagua kundi sahihi la bidhaa.';
  }
  if (!partial || has(body, 'price')) {
    data.price = Number(text(body.price));
    if (!Number.isInteger(data.price) || data.price <= 0) errors.price = 'Bei iwe namba kamili ya TZS iliyo kubwa kuliko sifuri.';
  }
  if (has(body, 'originalPrice')) {
    const raw = text(body.originalPrice);
    if (!raw || raw === '0') unset.push('originalPrice');
    else {
      data.originalPrice = Number(raw);
      if (!Number.isInteger(data.originalPrice) || data.originalPrice <= 0) {
        errors.originalPrice = 'Bei ya awali iwe namba kamili ya TZS.';
      }
    }
  }
  if (has(body, 'description')) {
    data.description = text(body.description);
    if (data.description.length > 2000) errors.description = 'Maelezo yasizidi herufi 2000.';
  }
  if (has(body, 'sizes')) {
    const sizes = toStringList(body.sizes);
    if (sizes === null) errors.sizes = 'Saizi ziwe orodha, mfano: S, M, L.';
    else data.sizes = sizes;
  }
  if (has(body, 'colors')) {
    const colors = toColors(body.colors);
    if (colors === null) errors.colors = 'Rangi ziwe orodha ya {name, hex}, mfano [{"name":"Nyeusi","hex":"#000000"}].';
    else data.colors = colors;
  }
  if (has(body, 'images')) {
    const images = toStringList(body.images);
    if (images === null || images.some((url) => !isHttpUrl(url))) errors.images = 'Picha za ziada ziwe viungo sahihi (https://...).';
    else data.images = images.slice(0, 10);
  }
  if (has(body, 'inStock')) data.inStock = toBool(body.inStock);
  if (has(body, 'featured')) data.featured = toBool(body.featured);
  if (has(body, 'badge')) {
    const badge = text(body.badge);
    if (!badge) unset.push('badge');
    else if (badge.length > 40) errors.badge = 'Badge isizidi herufi 40.';
    else data.badge = badge;
  }
  if (has(body, 'rating') && text(body.rating) !== '') {
    data.rating = Number(text(body.rating));
    if (!Number.isFinite(data.rating) || data.rating < 0 || data.rating > 5) errors.rating = 'Rating iwe kati ya 0 na 5.';
  }
  if (has(body, 'reviewsCount') && text(body.reviewsCount) !== '') {
    data.reviewsCount = Number(text(body.reviewsCount));
    if (!Number.isInteger(data.reviewsCount) || data.reviewsCount < 0) errors.reviewsCount = 'Idadi ya maoni iwe namba kamili isiyo hasi.';
  }

  let imageUrl = '';
  if (has(body, 'imageUrl')) {
    imageUrl = text(body.imageUrl);
    if (imageUrl && !isHttpUrl(imageUrl)) errors.imageUrl = 'Kiungo cha picha si sahihi. Kianze na https://';
  }

  return { data, unset, errors, imageUrl };
}

async function findProductOr404(id) {
  const productId = String(id);
  if (!mongoose.isValidObjectId(productId)) throw new HttpError(404, NOT_FOUND);
  const product = await Product.findById(productId);
  if (!product) throw new HttpError(404, NOT_FOUND);
  return product;
}

// ---------- public ----------

router.get('/', async (req, res) => {
  const query = req.query || {};
  const category = typeof query.category === 'string' ? query.category.trim() : '';
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 80) : '';
  const featured = typeof query.featured === 'string' ? query.featured.trim() : '';

  const filter = {};
  if (category && category !== 'vyote') filter.category = category;
  if (featured === 'true') filter.featured = true;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: pattern }, { description: pattern }];
  }

  const products = await Product.find(filter).sort(SORT).limit(500);
  res.json({ products: products.map(serializeProduct) });
});

router.get('/:id', async (req, res) => {
  const product = await findProductOr404(req.params.id);

  const related = await Product.find({ _id: { $ne: product._id }, category: product.category })
    .sort(SORT)
    .limit(4);
  if (related.length < 4) {
    const filler = await Product.find({ _id: { $ne: product._id }, category: { $ne: product.category } })
      .sort(SORT)
      .limit(4 - related.length);
    related.push(...filler);
  }

  res.json({ product: serializeProduct(product), related: related.map(serializeProduct) });
});

// ---------- admin ----------
// Order matters: authenticate BEFORE multer so strangers cannot push 5 MB files into memory.

router.post('/', requireAuth, requireAdmin, uploadProductImage, async (req, res) => {
  const { data, errors, imageUrl } = readProductFields(req.body || {}, { partial: false });

  if (req.file && !cloudinaryEnabled) throw new HttpError(503, CLOUDINARY_OFF);
  if (!req.file && !imageUrl && !errors.imageUrl) errors.image = 'Weka picha ya bidhaa au kiungo cha picha.';
  if (Object.keys(errors).length > 0) throw validationError(errors);

  let uploaded = null;
  if (req.file) {
    uploaded = await uploadImageBuffer(req.file.buffer);
    data.image = uploaded.url;
    data.imagePublicId = uploaded.publicId;
  } else {
    data.image = imageUrl;
  }

  try {
    const product = await Product.create(data);
    res.status(201).json({ product: serializeProduct(product) });
  } catch (err) {
    if (uploaded) await destroyImage(uploaded.publicId); // do not leave orphans behind
    throw err;
  }
});

router.put('/:id', requireAuth, requireAdmin, uploadProductImage, async (req, res) => {
  const product = await findProductOr404(req.params.id);
  const { data, unset, errors, imageUrl } = readProductFields(req.body || {}, { partial: true });

  if (req.file && !cloudinaryEnabled) throw new HttpError(503, CLOUDINARY_OFF);
  if (Object.keys(errors).length > 0) throw validationError(errors);

  const oldPublicId = product.imagePublicId;
  let uploaded = null;
  let replacedImage = false;

  if (req.file) {
    uploaded = await uploadImageBuffer(req.file.buffer);
    data.image = uploaded.url;
    data.imagePublicId = uploaded.publicId;
    replacedImage = true;
  } else if (imageUrl && imageUrl !== product.image) {
    data.image = imageUrl;
    unset.push('imagePublicId');
    replacedImage = true;
  }

  product.set(data);
  for (const key of unset) product.set(key, undefined);

  try {
    await product.save();
  } catch (err) {
    if (uploaded) await destroyImage(uploaded.publicId);
    throw err;
  }

  if (replacedImage && oldPublicId) await destroyImage(oldPublicId);
  res.json({ product: serializeProduct(product) });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const product = await findProductOr404(req.params.id);
  await product.deleteOne();
  await destroyImage(product.imagePublicId);
  res.json({ ok: true });
});

export default router;
