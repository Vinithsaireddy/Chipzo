'use strict';

/**
 * Custom API Error class.
 * Extends the native Error to carry HTTP status codes and structured error arrays.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 500)
   * @param {string} message    - Human-readable error message
   * @param {Array}  errors     - Optional array of validation error details
   * @param {string} stack      - Optional pre-built stack trace
   */
  constructor(statusCode, message, errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
