import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

/**
 * Build the Express application.
 * @param {{ serveClient?: boolean, clientDist?: string }} options
 */
export default function createApp({ serveClient = false, clientDist } = {}) {
  const isProd = process.env.NODE_ENV === 'production';
  const app = express();
  app.set('trust proxy', 1); // correct IPs/cookies behind reverse proxies (Render, Nginx…)

  /* ------------------------- Security & parsing ------------------------- */

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Allowed frontend origins: CLIENT_ORIGIN env var (+ local dev defaults).
  // Same-origin deployments don't need CORS; split deployments set CLIENT_ORIGIN.
  const allowedOrigins = [
    ...(process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
    ...(isProd ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173']),
  ];
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, false); // browser will block disallowed cross-origin calls
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Gentle global limit; stricter limit on auth endpoints against brute force.
  app.use(
    '/api',
    rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false })
  );
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
  });

  /* ------------------------------- Routes ------------------------------- */

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'nexora-api',
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      env: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  /* ------------- Serve the built React app (production) ------------- */

  if (serveClient && clientDist && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback: any non-API GET serves index.html
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return app;
}
