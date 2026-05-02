'use strict';

const Joi = require('joi');

const addressSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Full name is required',
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/, 'Indian phone number')
    .required()
    .messages({
      'string.pattern.name': 'Phone must be a valid 10-digit Indian mobile number',
      'any.required': 'Phone number is required',
    }),
  street: Joi.string().trim().min(5).max(200).required().messages({
    'any.required': 'Street address is required',
  }),
  city: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'City is required',
  }),
  state: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'State is required',
  }),
  pincode: Joi.string()
    .pattern(/^\d{6}$/, 'Indian pincode')
    .required()
    .messages({
      'string.pattern.name': 'Pincode must be a valid 6-digit Indian PIN',
      'any.required': 'Pincode is required',
    }),
});

const createOrderSchema = Joi.object({
  address: addressSchema.required(),
});

module.exports = { createOrderSchema, addressSchema };
