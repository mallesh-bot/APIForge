import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import environmentRoutes from './routes/environmentRoutes.js';
import executeRoutes from './routes/executeRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import testRunRoutes from './routes/testRunRoutes.js';
import documentationRoutes from './routes/documentationRoutes.js';
import mockShopKartRoutes from './routes/mockShopKartRoutes.js';

const app = express();

// Trust proxy for secure cookies behind reverse proxies (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS configuration for cross-origin requests & cookies
const allowedOrigins = [
  env.FRONTEND_ORIGIN,
  'https://apiforge-b9a.pages.dev',
  'https://apiforge-b9.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. mobile apps, curl, internal tests)
      if (!origin) return callback(null, true);

      // Allow configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow any Cloudflare Pages deployment for this project (e.g. preview branches)
      if (/^https:\/\/([a-z0-9-]+\.)?apiforge(-[a-z0-9]+)?\.pages\.dev$/.test(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body and Cookie Parsers
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiters for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/collections', collectionRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/environments', environmentRoutes);
app.use('/api/v1/execute', executeRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/test-runs', testRunRoutes);
app.use('/api/v1/collections', documentationRoutes);
app.use('/api/v1/mock/shopkart', mockShopKartRoutes);

// 404 handler for undefined API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Centralized error handler
app.use(errorHandler);

// Production static client serving
if (env.NODE_ENV === 'production') {
  const distPath = path.resolve('../client/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;
