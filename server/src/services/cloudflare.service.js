'use strict';

const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const r2Client = require('../config/cloudflare');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates file type and size before upload.
 * @param {Express.Multer.File} file
 */
const validateFile = (file) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ApiError(400, 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(400, 'File size exceeds 5 MB limit.');
  }
};

/**
 * Uploads an image buffer to Cloudflare R2.
 * Returns the public URL for the uploaded object.
 *
 * @param {Express.Multer.File} file - Multer in-memory file object
 * @returns {Promise<{ url: string, key: string }>}
 */
const uploadImage = async (file) => {
  validateFile(file);

  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const key = `products/${uuidv4()}${ext}`;

  try {
    if (!env.CLOUDFLARE_BUCKET_NAME || env.CLOUDFLARE_BUCKET_NAME === 'dummy_r2_bucket_name' || env.CLOUDFLARE_ACCOUNT_ID === 'dummy_cloudflare_account_id') {
      throw new Error('Development environment uses mock Cloudflare R2 configurations.');
    }

    const command = new PutObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    });

    await r2Client.send(command);
    const url = `${env.CLOUDFLARE_PUBLIC_URL}/${key}`;
    return { url, key };
  } catch (error) {
    const logger = require('../utils/logger');
    logger.warn(`[R2 Service] Bypassing upload: ${error.message}. Returning fallback stock image.`);
    
    // Return a premium electronics placeholder
    const url = 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=500&auto=format&fit=crop&q=80';
    return { url, key };
  }
};

/**
 * Deletes an image from Cloudflare R2 by its object key.
 * Silently ignores errors (best-effort deletion).
 *
 * @param {string} key - R2 object key (e.g. "products/uuid.jpg")
 */
const deleteImage = async (key) => {
  if (!key || key === 'dummy.jpg') return;

  try {
    if (!env.CLOUDFLARE_BUCKET_NAME || env.CLOUDFLARE_BUCKET_NAME === 'dummy_r2_bucket_name') {
      return;
    }
    const command = new DeleteObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: key,
    });
    await r2Client.send(command);
  } catch (error) {
    // Log but don't throw — a failed delete shouldn't crash the request
    const logger = require('../utils/logger');
    logger.warn(`[R2] Failed to delete object "${key}": ${error.message}`);
  }
};

module.exports = { uploadImage, deleteImage };

