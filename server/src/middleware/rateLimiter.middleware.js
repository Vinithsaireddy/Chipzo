'use strict';

const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

/**
 * Factory that creates a rate limiter with a consistent JSON error response.
 *
 * @param {number} windowMinutes - Rolling window duration in minutes
 * @param {number} max           - Maximum requests allowed in the window
 * @param {string} message       - Error message returned on rate limit hit
 */
const createLimiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,  // Return RateLimit-* headers
    legacyHeaders: false,    // Disable X-RateLimit-* headers
    handler: (req, res, next) => {
      next(new ApiError(429, message));
    },
  });

// ── General API limiter: 100 req / 15 min ────────────────────────────────────
const generalLimiter = createLimiter(
  15,
  100,
  'Too many requests from this IP. Please try again in 15 minutes.'
);

// ── Auth limiter: 10 req / 15 min (brute-force protection) ───────────────────
const authLimiter = createLimiter(
  15,
  10,
  'Too many authentication attempts. Please try again in 15 minutes.'
);

module.exports = { generalLimiter, authLimiter };
