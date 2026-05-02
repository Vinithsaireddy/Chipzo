'use strict';

const Joi = require('joi');

const addToCartSchema = Joi.object({
  productId: Joi.string()
    .pattern(/^[a-f\d]{24}$/i, 'MongoDB ObjectId')
    .required()
    .messages({
      'string.pattern.name': 'productId must be a valid MongoDB ObjectId',
      'any.required': 'productId is required',
    }),

  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
});

module.exports = { addToCartSchema, updateCartItemSchema };
