import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { normalizePhone } from '../utils/phone.js';
import { SEED_PRODUCTS } from './products.js';

const BCRYPT_COST = 12;

/**
 * Idempotent and non-destructive: only ever ADDS what is missing.
 *  - 0 products  -> insert the 9 starter products
 *  - admin phone unknown -> create the admin; known but not admin -> promote
 * Never deletes or overwrites existing data (an existing admin's password is left alone).
 */
export async function ensureSeed({ log = () => {} } = {}) {
  const result = { productsInserted: 0, admin: 'skipped' };

  // Make sure indexes (unique phone / reference, text index) exist before any write.
  await Promise.all([Product.init(), User.init()]);

  // Exact count on purpose: estimatedDocumentCount() reads collection metadata, which can be
  // stale (0) right after an unclean mongod shutdown and would seed the catalogue twice.
  const productCount = await Product.countDocuments({});
  if (productCount === 0) {
    // Staggered createdAt keeps the catalogue order of the list ("newest first" = first in the file).
    const now = Date.now();
    const docs = SEED_PRODUCTS.map((product, index) => {
      const stamp = new Date(now - index * 1000);
      return { ...product, createdAt: stamp, updatedAt: stamp };
    });
    await Product.insertMany(docs, { timestamps: false });
    result.productsInserted = docs.length;
    log(`Bidhaa ${docs.length} za mwanzo zimeongezwa.`);
  } else {
    log(`Bidhaa zipo tayari (${productCount}) - hakuna kilichoongezwa.`);
  }

  if (!env.ADMIN_PHONE || !env.ADMIN_PASSWORD) {
    log('ADMIN_PHONE/ADMIN_PASSWORD hazijawekwa - admin hajatengenezwa.');
    return result;
  }

  const phone = normalizePhone(env.ADMIN_PHONE);
  if (!phone) {
    log(`ONYO: ADMIN_PHONE "${env.ADMIN_PHONE}" si namba sahihi ya Tanzania - admin hajatengenezwa.`);
    result.admin = 'invalid-phone';
    return result;
  }

  const existing = await User.findOne({ phone });
  if (!existing) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, BCRYPT_COST);
    await User.create({ name: env.ADMIN_NAME, phone, passwordHash, role: 'admin' });
    result.admin = 'created';
    log(`Akaunti ya admin imetengenezwa (${phone}).`);
  } else if (existing.role !== 'admin') {
    existing.role = 'admin';
    await existing.save();
    result.admin = 'promoted';
    log(`Mtumiaji ${phone} amepandishwa kuwa admin (password yake haijabadilishwa).`);
  } else {
    result.admin = 'exists';
    log(`Admin yupo tayari (${phone}).`);
  }

  return result;
}
