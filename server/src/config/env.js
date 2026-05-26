'use strict';

/**
 * Centralized environment variable validation.
 * Fails fast on startup if any required key is absent.
 * All application code imports from this module — never from process.env directly.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

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

// Optional conditional check for Meta WhatsApp keys if the provider is set to 'meta'
if (process.env.WHATSAPP_PROVIDER === 'meta') {
  const metaKeys = [
    'META_WHATSAPP_PHONE_NUMBER_ID',
    'META_WHATSAPP_ACCESS_TOKEN',
    'META_WHATSAPP_TEMPLATE_NAME',
    'WHATSAPP_RECEIVER_NUMBER',
  ];
  const missingMeta = metaKeys.filter((key) => !process.env[key]);
  if (missingMeta.length > 0) {
    console.error(
      `\n❌  [VoltEx] Missing required Meta WhatsApp API variables:\n  ${missingMeta.join('\n  ')}\n`
    );
    process.exit(1);
  }
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

  // WhatsApp integration configs
  WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || 'mock',
  META_WHATSAPP_PHONE_NUMBER_ID: process.env.META_WHATSAPP_PHONE_NUMBER_ID || '',
  META_WHATSAPP_ACCESS_TOKEN: process.env.META_WHATSAPP_ACCESS_TOKEN || '',
  META_WHATSAPP_TEMPLATE_NAME: process.env.META_WHATSAPP_TEMPLATE_NAME || '',
  WHATSAPP_RECEIVER_NUMBER: process.env.WHATSAPP_RECEIVER_NUMBER || '',
});

