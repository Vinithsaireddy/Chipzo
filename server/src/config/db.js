'use strict';

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Connects to MongoDB with retry logic.
 * Retries up to MAX_RETRIES times with RETRY_DELAY_MS delay between attempts.
 * Throws after all retries exhausted so the caller (server.js) can exit.
 *
 * @param {number} attempt - Current attempt number (internal)
 */
const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      // These are no longer needed in Mongoose 7+ but kept for clarity
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(
      `❌  MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`
    );

    if (attempt < MAX_RETRIES) {
      logger.info(`⏳  Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }

    // All retries exhausted — bubble up to server.js uncaughtException handler
    throw new Error(
      `MongoDB connection failed after ${MAX_RETRIES} attempts: ${error.message}`
    );
  }
};

// ─── Mongoose connection event listeners ──────────────────────────────────────
mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('🔁  MongoDB reconnected');
});

module.exports = connectDB;
