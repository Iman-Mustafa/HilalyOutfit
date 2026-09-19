import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import configRoutes from './routes/config.js';

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());

const LOCAL_DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = curl, server-to-server, or a same-origin proxy: allowed.
      if (!origin) return callback(null, true);
      if (env.CLIENT_ORIGINS.includes(origin.replace(/\/+$/, ''))) return callback(null, true);
      // Development convenience: Vite may move to 5174, 5175... when 5173 is busy.
      if (!env.isProduction && LOCAL_DEV_ORIGIN.test(origin)) return callback(null, true);
      // Not on the allow-list: answer without CORS headers, so the browser blocks it.
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  }),
);

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/config', configRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
