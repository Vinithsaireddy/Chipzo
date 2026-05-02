'use strict';

const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/**
 * Creates a Razorpay order.
 * Amount must be passed in paise (1 INR = 100 paise).
 *
 * @param {object} params
 * @param {number} params.amount   - Amount in paise
 * @param {string} params.receipt  - Unique receipt ID (e.g. userId_timestamp)
 * @returns {Promise<object>}      - Razorpay order object
 */
const createRazorpayOrder = async ({ amount, receipt }) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert INR to paise
      currency: 'INR',
      receipt,
      payment_capture: true, // Auto-capture
    });
    return order;
  } catch (error) {
    throw new ApiError(
      502,
      `Payment gateway error: ${error.error?.description || error.message}`
    );
  }
};

/**
 * Verifies the Razorpay payment signature using HMAC SHA256.
 *
 * @param {object} params
 * @param {string} params.razorpayOrderId
 * @param {string} params.razorpayPaymentId
 * @param {string} params.razorpaySignature
 * @returns {boolean} true if valid
 */
const verifySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(razorpaySignature, 'hex')
  );

  if (!isValid) {
    throw new ApiError(400, 'Payment verification failed. Invalid signature.');
  }

  return true;
};

module.exports = { createRazorpayOrder, verifySignature };
