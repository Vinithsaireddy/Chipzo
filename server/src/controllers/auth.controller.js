'use strict';

const User = require('../models/User');
const authService = require('../services/auth.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/auth/signup
 * Registers a new user, returns JWT + user object.
 */
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Duplicate email check
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({ name, email, password });
  const token = authService.signToken(user._id);

  const userObj = user.toObject();
  delete userObj.password;

  return new ApiResponse(201, 'Account created successfully', {
    token,
    user: userObj,
  }).send(res);
});

/**
 * POST /api/auth/login
 * Authenticates user, returns JWT + user object.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Explicitly select password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const token = authService.signToken(user._id);

  const userObj = user.toObject();
  delete userObj.password;

  return new ApiResponse(200, 'Login successful', {
    token,
    user: userObj,
  }).send(res);
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (from req.user set by protect middleware).
 */
const getMe = asyncHandler(async (req, res) => {
  return new ApiResponse(200, 'User profile fetched successfully', {
    user: req.user,
  }).send(res);
});

module.exports = { signup, login, getMe };
