'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Catches all requests that reach this point without a matching route.
 * Must be registered AFTER all routes in app.js.
 */
const notFound = (req, res, next) => {
  next(
    new ApiError(
      404,
      `Route not found: [${req.method}] ${req.originalUrl}`
    )
  );
};

module.exports = { notFound };
