'use strict';

const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const r2Client = require('../config/cloudflare');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { getImageKey, PRODUCT_PREFIX } = require('../utils/imageHelper');

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
 * Stores the object with a "products/" prefix in R2,
 * but returns only the filename for database storage.
 *
 * @param {Express.Multer.File} file - Multer in-memory file object
 * @returns {Promise<{ fileName: string, key: string }>}
 */
const uploadImage = async (file) => {
  validateFile(file);

  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const fileName = `${uuidv4()}${ext}`;
  const key = `${PRODUCT_PREFIX}${fileName}`;

  try {
    if (
      env.CLOUDFLARE_API_TOKEN &&
      (!env.CLOUDFLARE_ACCESS_KEY_ID || !env.CLOUDFLARE_SECRET_ACCESS_KEY)
    ) {
      throw new ApiError(
        500,
        'Cloudflare R2 uploads require CLOUDFLARE_ACCESS_KEY_ID and CLOUDFLARE_SECRET_ACCESS_KEY. CLOUDFLARE_API_TOKEN alone is not valid for S3 uploads.'
      );
    }

    if (
      !env.CLOUDFLARE_BUCKET_NAME ||
      env.CLOUDFLARE_BUCKET_NAME === 'dummy_r2_bucket_name' ||
      env.CLOUDFLARE_ACCOUNT_ID === 'dummy_cloudflare_account_id' ||
      !env.CLOUDFLARE_ACCESS_KEY_ID ||
      !env.CLOUDFLARE_SECRET_ACCESS_KEY
    ) {
      throw new ApiError(
        500,
        'Cloudflare R2 is not configured correctly. Set CLOUDFLARE_ACCESS_KEY_ID and CLOUDFLARE_SECRET_ACCESS_KEY.'
      );
    }

    const command = new PutObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    });

    await r2Client.send(command);
    return { fileName, key };
  } catch (error) {
    logger.error(`[R2 Service] Upload failed for "${key}": ${error.message}`);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, 'Failed to upload image to Cloudflare R2.');
  }
};

/**
 * Deletes an image from Cloudflare R2 by its filename.
 * Silently ignores errors (best-effort deletion).
 *
 * @param {string} fileName - Just the filename (e.g. "uuid.jpg")
 */
const deleteImage = async (fileName) => {
  if (!fileName || fileName === 'dummy.jpg') return;

  const key = getImageKey(fileName);

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
    const logger = require('../utils/logger');
    logger.warn(`[R2] Failed to delete object "${key}": ${error.message}`);
  }
};

/**
 * Reads an image object from Cloudflare R2 by filename.
 * @param {string} fileName - Just the filename (e.g. "uuid.jpg")
 * @returns {Promise<{ body: NodeJS.ReadableStream, contentType?: string, contentLength?: number }>}
 */
const getImage = async (fileName) => {
  const key = getImageKey(fileName);

  try {
    const command = new GetObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: key,
    });

    const result = await r2Client.send(command);
    return {
      body: result.Body,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
    };
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      throw new ApiError(404, 'Image not found');
    }

    logger.error(`[R2 Service] Read failed for "${key}": ${error.message}`);
    throw new ApiError(502, 'Failed to read image from Cloudflare R2.');
  }
};

module.exports = { uploadImage, deleteImage, getImage };

