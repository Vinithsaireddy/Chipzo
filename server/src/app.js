'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');

const env = require('./config/env');
const router = require('./routes/index');
const { errorHandler } = require('./middleware/error.middleware');
const { notFound } = require('./middleware/notFound.middleware');
const { generalLimiter } = require('./middleware/rateLimiter.middleware');
const logger = require('./utils/logger');

const app = express();

// ─── Security: HTTP headers ───────────────────────────────────────────────────
app.use(helmet());

// ─── CORS: whitelist only CLIENT_URL ─────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── HTTP request logging via Morgan → Winston ────────────────────────────────
// In production, use a concise format; in development, use verbose 'dev'
const morganFormat =
  env.NODE_ENV === 'production'
    ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
    : 'dev';

app.use(
  morgan(morganFormat, {
    stream: logger.stream,
    // Skip logging health-check spam in production
    skip: (req) => env.NODE_ENV === 'production' && req.url === '/api/health',
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
// Strict 10 KB limit to prevent oversized payload attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Security: NoSQL injection prevention ────────────────────────────────────
app.use(mongoSanitize());

// ─── Security: HTTP parameter pollution prevention ────────────────────────────
app.use(hpp());

// ─── General rate limiter (applied globally) ──────────────────────────────────
// Auth routes apply an additional, stricter limiter in their own router
app.use('/api', generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', router);

// ─── 404 handler (must be after all routes) ───────────────────────────────────
app.use(notFound);

// ─── Global error handler (must be last, 4-arg signature) ────────────────────
app.use(errorHandler);

module.exports = app;
