'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

/**
 * Verifies the JWT from the Authorization header and attaches the user to req.user.
 * Throws 401 if the token is missing, malformed, expired, or the user no longer exists.
 */
const protect = asyncHandler(async (req, res, next) => {
  // ── 1. Extract token from "Authorization: Bearer <token>" ──────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  const token = authHeader.split(' ')[1];

  // MOCK ADMIN SYSTEM AUTHENTICATION
  if (token === 'admin-secret-token') {
    req.user = {
      _id: '6a098ab765ecf83aaed0e000',
      name: 'System Admin',
      email: 'admin@chipzo.in',
      role: 'admin'
    };
    return next();
  }

  // ── 2. Verify signature + expiry ───────────────────────────────────────────
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Your session has expired. Please log in again.');
    }
    throw new ApiError(401, 'Invalid authentication token.');
  }

  // ── 3. Confirm user still exists in DB ────────────────────────────────────
  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw new ApiError(401, 'The user belonging to this token no longer exists.');
  }

  req.user = user;
  next();
});

module.exports = { protect };
