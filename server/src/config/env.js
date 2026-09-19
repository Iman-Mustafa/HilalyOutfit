import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path of the `server/` folder, independent of the process cwd. */
export const SERVER_ROOT = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(SERVER_ROOT, '.env'), quiet: true });

const str = (key, fallback = '') => {
  const value = process.env[key];
  return value === undefined || value === null ? fallback : String(value).trim();
};

const NODE_ENV = str('NODE_ENV', 'development') || 'development';
const isProduction = NODE_ENV === 'production';

const paymentDriver = str('PAYMENT_DRIVER', 'simulator').toLowerCase() === 'gateway' ? 'gateway' : 'simulator';

export const env = {
  NODE_ENV,
  isProduction,
  PORT: Number.parseInt(str('PORT', '5000'), 10) || 5000,
  MONGODB_URI: str('MONGODB_URI'),
  JWT_SECRET: str('JWT_SECRET'),
  JWT_EXPIRES_IN: str('JWT_EXPIRES_IN', '7d') || '7d',
  CLIENT_ORIGINS: str('CLIENT_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  ADMIN_NAME: str('ADMIN_NAME', 'Hilaly Admin') || 'Hilaly Admin',
  ADMIN_PHONE: str('ADMIN_PHONE'),
  ADMIN_PASSWORD: str('ADMIN_PASSWORD'),
  CLOUDINARY_CLOUD_NAME: str('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: str('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: str('CLOUDINARY_API_SECRET'),
  CLOUDINARY_FOLDER: str('CLOUDINARY_FOLDER', 'hilaly-outfit/products') || 'hilaly-outfit/products',
  PAYMENT_DRIVER: paymentDriver,
  PAYMENT_WEBHOOK_SECRET: str('PAYMENT_WEBHOOK_SECRET'),
};

/**
 * Validates the configuration at boot. In production the server refuses to
 * start without a strong JWT secret. In development a missing secret is
 * replaced by a random per-process one (tokens die on restart) with a warning.
 */
export async function assertEnv() {
  if (env.JWT_SECRET.length < 32) {
    if (isProduction) {
      throw new Error(
        'JWT_SECRET haipo au ni fupi mno (inahitajika angalau herufi 32). Server haiwezi kuwaka kwenye production bila siri imara.',
      );
    }
    const { randomBytes } = await import('node:crypto');
    env.JWT_SECRET = randomBytes(32).toString('hex');
    console.warn(
      '[onyo] JWT_SECRET haipo au ni fupi kwenye server/.env - imetengenezwa ya muda. Watumiaji watatolewa kila server inapowashwa upya.',
    );
  }
  if (isProduction && !env.MONGODB_URI) {
    throw new Error('MONGODB_URI haijawekwa. Kwenye production lazima uweke kiungo cha MongoDB halisi.');
  }
}
