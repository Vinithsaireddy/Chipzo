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
  const { name, email, password, phone, city } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({ name, email, password, phone, city });
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

/**
 * PUT /api/auth/profile
 * Updates the authenticated user's name, phone, or password.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  if (newPassword) {
    if (!currentPassword) {
      throw new ApiError(400, 'Current password is required to set a new password.');
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new ApiError(401, 'Current password is incorrect.');
    user.password = newPassword;
  }

  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  return new ApiResponse(200, 'Profile updated successfully', { user: userObj }).send(res);
});

module.exports = { signup, login, getMe, updateProfile };
