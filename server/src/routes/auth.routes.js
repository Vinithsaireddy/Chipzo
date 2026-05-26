'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const { signupSchema, loginSchema, updateProfileSchema } = require('../validators/auth.validator');

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

module.exports = router;
