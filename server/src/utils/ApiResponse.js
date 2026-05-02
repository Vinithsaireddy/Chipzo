'use strict';

/**
 * Standardized API success response wrapper.
 * Ensures every success response shares the same JSON envelope.
 */
class ApiResponse {
  /**
   * @param {number} statusCode  - HTTP status code (2xx)
   * @param {string} message     - Human-readable success message
   * @param {*}      data        - Response payload (object, array, null)
   * @param {object} pagination  - Optional pagination meta for list endpoints
   */
  constructor(statusCode, message, data = null, pagination = null) {
    this.success = true;
    this.message = message;
    this.data = data;

    if (pagination) {
      this.pagination = pagination;
    }

    this.statusCode = statusCode;
  }

  /**
   * Send the response via Express res object.
   * @param {import('express').Response} res
   */
  send(res) {
    const body = {
      success: this.success,
      message: this.message,
      data: this.data,
    };

    if (this.pagination) {
      body.pagination = this.pagination;
    }

    return res.status(this.statusCode).json(body);
  }
}

module.exports = ApiResponse;
