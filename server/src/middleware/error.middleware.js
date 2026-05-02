'use strict';

const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Global Express error-handling middleware.
 * Must be the LAST middleware registered in app.js (4 arguments).
 *
 * Normalizes all error types into a consistent JSON response.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // ── Mongoose: field-level validation errors ──────────────────────────────────
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose: bad ObjectId cast ───────────────────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 404;
    message = `Invalid value for field: ${err.path}`;
    errors = [];
  }

  // ── MongoDB: duplicate key (unique constraint) ────────────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists`;
    errors = [{ field, message }];
  }

  // ── JWT errors (passthrough from auth middleware) ─────────────────────────────
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired authentication token';
    errors = [];
  }

  // ── Multer errors ─────────────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size exceeds the 5 MB limit';
    errors = [];
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field in upload';
    errors = [];
  }

  // ── Log ───────────────────────────────────────────────────────────────────────
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${message}`, {
      statusCode,
      stack: err.stack,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} — ${statusCode}: ${message}`);
  }

  // ── Build response ────────────────────────────────────────────────────────────
  const body = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    body.errors = errors;
  }

  // Never expose stack traces in production
  if (env.NODE_ENV !== 'production' && err.stack) {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
};

module.exports = { errorHandler };
