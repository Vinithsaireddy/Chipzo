'use strict';

const Joi = require('joi');
const { PRODUCT_CATEGORIES } = require('../models/Product');

// ── Create ─────────────────────────────────────────────────────────────────────
const createProductSchema = Joi.object({
  id: Joi.string().trim().max(200),

  name: Joi.string().trim().min(2).max(200).required().messages({
    'any.required': 'Product name is required',
  }),

  category: Joi.string()
    .valid(...PRODUCT_CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),

  description: Joi.string().trim().max(2000).allow('').default(''),

  specifications: Joi.object().default({}),

  interfaces: Joi.array().items(Joi.string()).default([]),

  price: Joi.number().min(0).allow(null).default(null).messages({
    'number.min': 'Price cannot be negative',
  }),

  currency: Joi.string().trim().uppercase().max(10).default('INR'),

  images: Joi.array().items(Joi.string()).default([]),
});

// ── Update (all fields optional, at least one required) ───────────────────────
const updateProductSchema = Joi.object({
  id: Joi.string().trim().max(200),
  name: Joi.string().trim().min(2).max(200),
  category: Joi.string().valid(...PRODUCT_CATEGORIES),
  description: Joi.string().trim().max(2000).allow(''),
  specifications: Joi.object(),
  interfaces: Joi.array().items(Joi.string()),
  price: Joi.number().min(0).allow(null),
  currency: Joi.string().trim().uppercase().max(10),
  images: Joi.array().items(Joi.string()),
}).min(1); // At least one field must be provided

module.exports = { createProductSchema, updateProductSchema };
