'use strict';

const Joi = require('joi');
const { PRODUCT_CATEGORIES } = require('../models/Product');

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    'any.required': 'Product name is required',
  }),

  price: Joi.number().min(0).required().messages({
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),

  description: Joi.string().trim().min(10).max(2000).required().messages({
    'string.min': 'Description must be at least 10 characters',
    'any.required': 'Description is required',
  }),

  stock: Joi.number().integer().min(0).required().messages({
    'number.min': 'Stock cannot be negative',
    'any.required': 'Stock quantity is required',
  }),

  category: Joi.string()
    .valid(...PRODUCT_CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200),
  price: Joi.number().min(0),
  description: Joi.string().trim().min(10).max(2000),
  stock: Joi.number().integer().min(0),
  category: Joi.string().valid(...PRODUCT_CATEGORIES),
}).min(1); // At least one field must be provided for update

module.exports = { createProductSchema, updateProductSchema };
