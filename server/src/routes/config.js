import { Router } from 'express';
import { env } from '../config/env.js';
import { cloudinaryEnabled } from '../config/cloudinary.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ paymentDriver: env.PAYMENT_DRIVER, cloudinaryEnabled });
});

export default router;
