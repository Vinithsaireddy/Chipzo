'use strict';

const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const logger = require('../utils/logger');

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

  let sigBuffer;
  try {
    sigBuffer = Buffer.from(razorpaySignature, 'hex');
  } catch (err) {
    throw new ApiError(400, 'Payment verification failed. Invalid signature format.');
  }

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  // timingSafeEqual requires identical buffer lengths. Guard against mismatches.
  if (sigBuffer.length !== expectedBuffer.length) {
    throw new ApiError(400, 'Payment verification failed. Invalid signature length.');
  }

  const isValid = crypto.timingSafeEqual(expectedBuffer, sigBuffer);

  if (!isValid) {
    throw new ApiError(400, 'Payment verification failed. Invalid signature.');
  }

  return true;
};

/**
 * Processes a full refund for a Razorpay payment.
 *
 * @param {object} params
 * @param {string} params.paymentId  - The Razorpay payment ID to refund
 * @param {number} params.amount     - Amount in INR (optional; full refund if omitted)
 * @returns {Promise<object>}        - Razorpay refund object
 */
const processRefund = async ({ paymentId, amount }) => {
  try {
    const refundOptions = {};
    if (amount != null) {
      refundOptions.amount = Math.round(amount * 100);
    }
    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    logger.info(`[Payment] Refund processed — paymentId: ${paymentId}, refundId: ${refund.id}, amount: ${refund.amount}`);
    return refund;
  } catch (error) {
    logger.error(`[Payment] Refund failed for paymentId: ${paymentId} — ${error.error?.description || error.message}`);
    throw new ApiError(
      502,
      `Refund failed: ${error.error?.description || error.message}`
    );
  }
};

module.exports = { createRazorpayOrder, verifySignature, processRefund };
