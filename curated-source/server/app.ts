import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { authenticate } from './lib/auth';
import { POLICIES_VERSION } from './lib/legal';
import { errorHandler, notFoundHandler } from './lib/errors';
import { authRouter } from './routes/auth';
import { catalogRouter } from './routes/catalog';
import { ordersRouter } from './routes/orders';
import { vendorRouter } from './routes/vendor';
import { adminRouter } from './routes/admin';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:', 'blob:'],
          'media-src': ["'self'", 'blob:'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        },
      },
    }),
  );
  app.use(compression());
  app.use(cors({ origin: config.corsOrigins, credentials: false }));
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.use(authenticate);
  api.use('/auth', rateLimit({ windowMs: 15 * 60_000, limit: config.isProd ? 50 : 1000, standardHeaders: true, legacyHeaders: false }));
  api.get('/health', (_req, res) => void res.json({ ok: true, time: new Date().toISOString() }));
  api.get('/config', (_req, res) => void res.json({ commissionRate: config.commissionRate, policiesVersion: POLICIES_VERSION, maxPriceCents: config.maxPriceCents }));
  api.use('/auth', authRouter);
  api.use('/orders', ordersRouter);
  api.use('/vendor', vendorRouter);
  api.use('/admin', adminRouter);
  api.use('/', catalogRouter);
  api.use(notFoundHandler);

  app.use('/api', api);
  app.use('/uploads', express.static(config.uploadDir, { maxAge: '30d', immutable: true, fallthrough: false }));

  // Serve the built SPA when present (single-server deployment). Static hosts use dist/.htaccess instead.
  if (fs.existsSync(path.join(config.distDir, 'index.html'))) {
    app.use(express.static(config.distDir, { maxAge: '1h', index: false }));
    app.get(/^(?!\/api|\/uploads).*/, (_req, res) => res.sendFile(path.join(config.distDir, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
