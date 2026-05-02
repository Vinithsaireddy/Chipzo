'use strict';

const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 80 characters',
    'any.required': 'Name is required',
  }),

  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

module.exports = { signupSchema, loginSchema };
