'use strict';

const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

/**
 * Cloudflare R2 is S3-compatible.
 * We point the S3 client at the Cloudflare endpoint using the Account ID.
 * Authentication uses API Token as the secret key (standard Cloudflare R2 pattern).
 */
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_API_TOKEN || 'placeholder',
    secretAccessKey: env.CLOUDFLARE_API_TOKEN || 'placeholder',
  },
});

module.exports = r2Client;
