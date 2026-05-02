'use strict';

const Razorpay = require('razorpay');
const env = require('./env');

/**
 * Razorpay SDK instance.
 * Exported as a singleton so the same HTTP pool is reused across requests.
 */
const razorpayInstance = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;
