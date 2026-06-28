'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authService = require('../services/auth.service');
const emailService = require('../services/emailService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

/**
 * POST /api/auth/signup
 * Registers a new user, returns JWT + user object, dispatches Welcome/OTP email.
 */
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone, city } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    city,
    isVerified: true, // Directly verified! No OTP verification step needed.
    otp: null,
    otpExpiresAt: null,
    otpLastSentAt: null,
  });

  // Asynchronously send the welcome email
  emailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
    console.error('[Welcome Email Error] Failed to send welcome mail:', err.message);
  });

  const token = authService.signToken(user);

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.otp;

  return new ApiResponse(201, 'Account created successfully. Verification code dispatched.', {
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

  const token = authService.signToken(user);

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.otp;

  return new ApiResponse(200, 'Login successful', {
    token,
    user: userObj,
  }).send(res);
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
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
  delete userObj.otp;

  return new ApiResponse(200, 'Profile updated successfully', { user: userObj }).send(res);
});

/**
 * POST /api/auth/forgot-password
 * Generates a 6-digit OTP, stores it hashed on the user record,
 * and dispatches it via email. Rate-limited per email (60s cooldown).
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  // Always return 200 to prevent email enumeration
  if (!user) {
    return new ApiResponse(200, 'If an account with that email exists, an OTP has been sent.').send(res);
  }

  // Rate limit: 60s cooldown per email
  if (user.otpLastSentAt) {
    const elapsed = Date.now() - new Date(user.otpLastSentAt).getTime();
    if (elapsed < 60000) {
      const remaining = Math.ceil((60000 - elapsed) / 1000);
      throw new ApiError(429, `Please wait ${remaining}s before requesting another OTP.`);
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  user.otp = hashedOtp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  user.otpLastSentAt = new Date();
  await user.save();

  // Fire-and-forget email dispatch
  emailService.sendPasswordResetOTP(user.email, user.name, otp).catch((err) => {
    console.error('[PasswordReset OTP Email Error]', err.message);
  });

  return new ApiResponse(200, 'If an account with that email exists, an OTP has been sent.').send(res);
});

/**
 * POST /api/auth/verify-forgot-otp
 * Verifies the OTP and returns a short-lived JWT reset token.
 */
const verifyForgotOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+otp +otpExpiresAt');
  if (!user || !user.otp || !user.otpExpiresAt) {
    throw new ApiError(400, 'Invalid or expired OTP. Please request a new one.');
  }

  if (Date.now() > new Date(user.otpExpiresAt).getTime()) {
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  if (hashedOtp !== user.otp) {
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }

  // OTP is valid — clear it and issue a short-lived reset token
  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();

  const resetToken = jwt.sign(
    { id: user._id.toString(), purpose: 'password-reset' },
    env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  return new ApiResponse(200, 'OTP verified successfully.', { resetToken }).send(res);
});

/**
 * POST /api/auth/reset-password
 * Resets the user's password using a valid reset token.
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new ApiError(400, 'Invalid or expired reset token. Please start over.');
  }

  if (decoded.purpose !== 'password-reset') {
    throw new ApiError(400, 'Invalid reset token purpose.');
  }

  const user = await User.findById(decoded.id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  user.password = password;
  await user.save();

  return new ApiResponse(200, 'Password reset successful. You can now log in.').send(res);
});

module.exports = {
  signup,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  verifyForgotOTP,
  resetPassword,
};
