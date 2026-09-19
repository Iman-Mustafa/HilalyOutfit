import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { HttpError } from '../utils/httpError.js';

const UNAUTHORIZED = 'Tafadhali ingia kwenye akaunti yako ili kuendelea.';
const SESSION_EXPIRED = 'Muda wa kuingia umeisha. Tafadhali ingia tena.';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verifies the Bearer token and loads the user fresh from the database, so a
 * deleted user or a changed role takes effect immediately (the `role` claim in
 * the token is never trusted on its own).
 */
export async function requireAuth(req, _res, next) {
  const header = String(req.headers.authorization || '');
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  if (!match) throw new HttpError(401, UNAUTHORIZED);

  let payload;
  try {
    payload = jwt.verify(match[1], env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, SESSION_EXPIRED);
  }

  const userId = typeof payload?.sub === 'string' ? payload.sub : '';
  if (!mongoose.isValidObjectId(userId)) throw new HttpError(401, SESSION_EXPIRED);

  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, SESSION_EXPIRED);

  req.user = user;
  next();
}

/** Must run after requireAuth; req.user was just re-loaded from the DB. */
export function requireAdmin(req, _res, next) {
  if (!req.user) throw new HttpError(401, UNAUTHORIZED);
  if (req.user.role !== 'admin') {
    throw new HttpError(403, 'Huna ruhusa ya kufanya kitendo hiki. Sehemu hii ni ya wasimamizi tu.');
  }
  next();
}
