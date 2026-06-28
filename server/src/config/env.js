'use strict';

/**
 * Centralized environment variable validation.
 * Fails fast on startup if any required key is absent.
 * All application code imports from this module — never from process.env directly.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const getEnv = (...keys) => keys.find((key) => process.env[key]) ? process.env[keys.find((key) => process.env[key])] : '';

const REQUIRED_KEYS = [
  'PORT',
  'NODE_ENV',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'CLIENT_URL',
];

const missingKeys = REQUIRED_KEYS.filter((key) => !process.env[key]);

const cloudflareAccountId = getEnv('CLOUDFLARE_ACCOUNT_ID', 'R2_ACCOUNT_ID');
const cloudflareBucketName = getEnv('CLOUDFLARE_BUCKET_NAME', 'R2_BUCKET_NAME');
const cloudflarePublicUrl = getEnv('CLOUDFLARE_PUBLIC_URL', 'R2_PUBLIC_URL');

if (!cloudflareAccountId || !cloudflareBucketName || !cloudflarePublicUrl) {
  missingKeys.push(
    ...[
      !cloudflareAccountId && 'CLOUDFLARE_ACCOUNT_ID or R2_ACCOUNT_ID',
      !cloudflareBucketName && 'CLOUDFLARE_BUCKET_NAME or R2_BUCKET_NAME',
      !cloudflarePublicUrl && 'CLOUDFLARE_PUBLIC_URL or R2_PUBLIC_URL',
    ].filter(Boolean)
  );
}

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

  CLOUDFLARE_ACCOUNT_ID: cloudflareAccountId,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || '',
  CLOUDFLARE_ACCESS_KEY_ID: getEnv('CLOUDFLARE_ACCESS_KEY_ID', 'R2_ACCESS_KEY_ID'),
  CLOUDFLARE_SECRET_ACCESS_KEY: getEnv('CLOUDFLARE_SECRET_ACCESS_KEY', 'R2_SECRET_ACCESS_KEY'),
  CLOUDFLARE_BUCKET_NAME: cloudflareBucketName,
  CLOUDFLARE_PUBLIC_URL: cloudflarePublicUrl,
  CLOUDFLARE_ENDPOINT: getEnv('CLOUDFLARE_ENDPOINT', 'R2_ENDPOINT'),

  RAPIDO_API_KEY: process.env.RAPIDO_API_KEY || '',
  RAPIDO_BASE_URL: process.env.RAPIDO_BASE_URL || 'https://api.rapido.bike/v1',

  BORZO_API_KEY: process.env.BORZO_API_KEY || '',
  BORZO_BASE_URL: process.env.BORZO_BASE_URL || 'https://robotapitest-in.borzodelivery.com/api/business/1.8',
  BORZO_PICKUP_ADDRESS: process.env.BORZO_PICKUP_ADDRESS || 'KR Road, VV Puram, Bangalore',
  BORZO_PICKUP_PHONE: process.env.BORZO_PICKUP_PHONE || '+918022421739',
  BORZO_PICKUP_NAME: process.env.BORZO_PICKUP_NAME || 'Chipzo Store',

  DELIVERY_PROVIDER: process.env.DELIVERY_PROVIDER || 'borzo',

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

