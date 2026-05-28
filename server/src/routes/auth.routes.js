'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const { signupSchema, loginSchema, updateProfileSchema, forgotPasswordSchema, verifyForgotOTPSchema, resetPasswordSchema } = require('../validators/auth.validator');

/**
 * POST /api/auth/signup
 * Rate limited to 10 req/15min to prevent account farming.
 */
router.post('/signup', authLimiter, validate(signupSchema), authController.signup);

/**
 * POST /api/auth/login
 * Rate limited to 10 req/15min to prevent brute force.
 */
router.post('/login', authLimiter, validate(loginSchema), authController.login);

/**
 * GET /api/auth/me
 * Protected — returns current user profile.
 */
router.get('/me', protect, authController.getMe);

/**
 * PUT /api/auth/profile
 * Protected — updates current user profile (name, phone, password).
 */
router.put('/profile', protect, validate(updateProfileSchema), authController.updateProfile);

/**
 * POST /api/auth/forgot-password
 * Sends a 6-digit OTP to the user's email for password reset.
 */
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * POST /api/auth/verify-forgot-otp
 * Verifies the OTP and returns a short-lived reset JWT.
 */
router.post('/verify-forgot-otp', authLimiter, validate(verifyForgotOTPSchema), authController.verifyForgotOTP);

/**
 * POST /api/auth/reset-password
 * Resets the password using a valid reset token.
 */
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
