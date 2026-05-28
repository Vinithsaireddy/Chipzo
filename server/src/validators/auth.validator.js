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

  phone: Joi.string().allow('').optional(),
  city: Joi.string().allow('').optional(),
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

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
  phone: Joi.string().allow('').max(20).optional(),
  currentPassword: Joi.string().optional(),
  newPassword: Joi.string().min(8).max(128).optional(),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update.' });

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

const verifyForgotOTPSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  otp: Joi.string().length(6).required().messages({
    'string.length': 'OTP must be exactly 6 digits',
    'any.required': 'OTP is required',
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  }),
});

module.exports = { signupSchema, loginSchema, updateProfileSchema, forgotPasswordSchema, verifyForgotOTPSchema, resetPasswordSchema };
