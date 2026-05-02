'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Returns a middleware that validates req.body against the provided Joi schema.
 * Collects ALL validation errors (abortEarly: false) and returns them in one response.
 *
 * @param {import('joi').ObjectSchema} schema - Joi object schema
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,       // Collect all errors, not just the first
    stripUnknown: true,      // Remove keys not in schema silently
    convert: true,           // Coerce types (e.g. string "10" to number)
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));

    return next(new ApiError(400, 'Validation failed', details));
  }

  // Replace req.body with the sanitized/coerced value from Joi
  req.body = value;
  next();
};

module.exports = { validate };
