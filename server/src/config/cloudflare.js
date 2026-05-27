'use strict';

const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

/**
 * Cloudflare R2 is S3-compatible.
 * We point the S3 client at the Cloudflare endpoint using the Account ID.
 * Authentication uses an R2 Access Key ID + Secret Access Key pair.
 */
const r2Client = new S3Client({
  region: 'auto',
  endpoint: env.CLOUDFLARE_ENDPOINT || `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID || 'placeholder',
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY || 'placeholder',
  },
});

module.exports = r2Client;
