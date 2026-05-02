'use strict';

/**
 * Wraps an async route handler so any thrown error (or rejected promise)
 * is forwarded to Express's global error-handling middleware via next(err).
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function}  - Express-compatible middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
