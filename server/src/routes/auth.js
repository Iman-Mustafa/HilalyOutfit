import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { HttpError, validationError } from '../utils/httpError.js';
import { normalizePhone } from '../utils/phone.js';
import { serializeUser } from '../utils/serialize.js';

const router = Router();

export const BCRYPT_COST = 12;
const INVALID_LOGIN = 'Namba ya simu au password si sahihi.';
// Compared against when the phone is unknown, so both failure paths cost the same time.
const DUMMY_HASH = bcrypt.hashSync('hilaly-dummy-password-0', BCRYPT_COST);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Umejaribu mara nyingi mno. Tafadhali subiri dakika 15 kisha ujaribu tena.' },
});

/** Only real strings are accepted - objects like {"$ne": null} become ''. */
const text = (value) => (typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '');

export function validatePassword(password) {
  if (password.length < 8) return 'Password iwe na angalau herufi 8.';
  if (password.length > 128) return 'Password isizidi herufi 128.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password lazima iwe na angalau herufi moja na tarakimu moja.';
  }
  return null;
}

router.post('/register', authLimiter, async (req, res) => {
  const body = req.body || {};
  const name = text(body.name).trim().replace(/\s+/g, ' ');
  const rawPhone = text(body.phone);
  const phone = normalizePhone(rawPhone);
  const password = text(body.password);

  const errors = {};
  if (name.length < 2 || name.length > 60) errors.name = 'Jina liwe na herufi 2 hadi 60.';
  if (!rawPhone.trim()) errors.phone = 'Namba ya simu inahitajika.';
  else if (!phone) errors.phone = 'Namba ya simu si sahihi. Tumia namba ya Tanzania, mfano 0712345678.';
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (Object.keys(errors).length > 0) throw validationError(errors);

  if (await User.exists({ phone })) {
    throw new HttpError(409, 'Namba hii ya simu tayari imesajiliwa. Tafadhali ingia.', {
      phone: 'Namba hii tayari imesajiliwa.',
    });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  // Role is ALWAYS customer here, whatever the body says.
  const user = await User.create({ name, phone, passwordHash, role: 'customer' });

  res.status(201).json({ token: signToken(user), user: serializeUser(user) });
});

router.post('/login', authLimiter, async (req, res) => {
  const body = req.body || {};
  const rawPhone = text(body.phone);
  const password = text(body.password);

  const errors = {};
  if (!rawPhone.trim()) errors.phone = 'Weka namba yako ya simu.';
  if (!password) errors.password = 'Weka password yako.';
  if (Object.keys(errors).length > 0) throw validationError(errors, 'Weka namba ya simu na password.');

  const phone = normalizePhone(rawPhone);
  const user = phone ? await User.findOne({ phone }).select('+passwordHash') : null;
  const passwordOk = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !passwordOk) throw new HttpError(401, INVALID_LOGIN);

  res.json({ token: signToken(user), user: serializeUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

export default router;
