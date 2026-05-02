'use strict';

/**
 * VoltEx API — Entry Point
 *
 * Startup sequence:
 * 1. Validate all environment variables (fail fast)
 * 2. Connect to MongoDB (with retry)
 * 3. Start Express server only after DB is connected
 * 4. Register process-level error handlers for graceful shutdown
 */

// ── Step 1: Env validation (will process.exit(1) if any required key is missing)
const env = require('./src/config/env');

const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');

// ─── Uncaught exception handler ────────────────────────────────────────────────
// This handles synchronous errors thrown outside of any try/catch or async context.
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down', { message: err.message, stack: err.stack });
  process.exit(1);
});

// ─── Main startup function ─────────────────────────────────────────────────────
const startServer = async () => {
  // ── Step 2: Connect to MongoDB ───────────────────────────────────────────────
  await connectDB();

  // ── Step 3: Start HTTP server ────────────────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀  VoltEx API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // ─── Unhandled promise rejection handler ───────────────────────────────────
  // Handles async errors not caught by asyncHandler middleware.
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION — shutting down', {
      reason: reason?.message || reason,
      promise,
    });
    // Give the server time to finish in-flight requests, then exit
    server.close(() => {
      process.exit(1);
    });
  });

  // ─── Graceful SIGTERM shutdown (e.g. Docker, Kubernetes, Heroku) ──────────
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Closing HTTP server gracefully...');
    server.close(() => {
      logger.info('HTTP server closed. Process exiting.');
      process.exit(0);
    });
  });

  // ─── Graceful SIGINT shutdown (Ctrl+C in development) ────────────────────
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Closing HTTP server gracefully...');
    server.close(() => {
      logger.info('HTTP server closed. Process exiting.');
      process.exit(0);
    });
  });
};

startServer().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
