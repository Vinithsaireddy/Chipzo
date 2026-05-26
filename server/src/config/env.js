'use strict';

/**
 * Centralized environment variable validation.
 * Fails fast on startup if any required key is absent.
 * All application code imports from this module — never from process.env directly.
 */

require('dotenv').config();

const REQUIRED_KEYS = [
  'PORT',
  'NODE_ENV',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_BUCKET_NAME',
  'CLOUDFLARE_PUBLIC_URL',
  'CLIENT_URL',
];

const missingKeys = REQUIRED_KEYS.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  console.error(
    `\n❌  [VoltEx] Missing required environment variables:\n  ${missingKeys.join('\n  ')}\n`
  );
  console.error('Please set the above keys in your .env file and restart.\n');
  process.exit(1);
}

module.exports = Object.freeze({
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV,

  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,

  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || '',
  CLOUDFLARE_BUCKET_NAME: process.env.CLOUDFLARE_BUCKET_NAME,
  CLOUDFLARE_PUBLIC_URL: process.env.CLOUDFLARE_PUBLIC_URL,

  RAPIDO_API_KEY: process.env.RAPIDO_API_KEY || '',
  RAPIDO_BASE_URL: process.env.RAPIDO_BASE_URL || 'https://api.rapido.bike/v1',

  CLIENT_URL: process.env.CLIENT_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'support@shopchipzo.com',
});
