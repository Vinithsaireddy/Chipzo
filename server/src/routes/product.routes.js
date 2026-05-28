'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');

// ── Multer: in-memory storage (buffer passed to Cloudflare R2 service) ────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
    cb(null, true);
  },
});

const parseMultipartJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const rawValue = Array.isArray(value) ? value[value.length - 1] : value;

  if (typeof rawValue === 'string') {
    try {
      return JSON.parse(rawValue);
    } catch (error) {
      return fallback;
    }
  }

  if (typeof rawValue === 'object') {
    return rawValue;
  }

  return fallback;
};

// ── Public routes ─────────────────────────────────────────────────────────────

/** GET /api/products — Paginated product listing with filters */
router.get('/', productController.getProducts);

/** GET /api/products/slug/:slug — Lookup by inventory slug (e.g. "arduino_uno_r3") */
router.get('/slug/:slug', productController.getProductBySlug);

/** GET /api/products/images/* — Streams product images from Cloudflare R2 */
router.get('/images/*', productController.getProductImage);

/** GET /api/products/:id — Single product by MongoDB _id */
router.get('/:id', productController.getProduct);

// ── Preprocessing Middleware for Multipart Form Data ────────────────────────
const preprocessMultipartProduct = (req, res, next) => {
  // Coerce numeric fields that arrive as multipart strings
  if (req.body.price !== undefined && req.body.price !== null && req.body.price !== '') {
    req.body.price = parseFloat(req.body.price);
  }

  // Multipart fields can arrive as JSON strings or repeated values.
  req.body.specifications = parseMultipartJsonField(req.body.specifications, {});

  const parsedInterfaces = parseMultipartJsonField(req.body.interfaces, []);
  req.body.interfaces = Array.isArray(parsedInterfaces) ? parsedInterfaces : [];
  
  // If files were uploaded via multipart, Multer populates req.files.
  // We remove raw/file strings from req.body.images so Joi doesn't fail on .uri() check.
  if (req.files && req.files.length > 0) {
    delete req.body.images;
  }

  next();
};

// ── Protected routes ──────────────────────────────────────────────────────────

/**
 * POST /api/products
 * Creates a new product. Images are optional — up to 5 files via multipart field "images".
 */
router.post(
  '/',
  protect,
  upload.array('images', 5),
  preprocessMultipartProduct,
  validate(createProductSchema),
  productController.createProduct
);

/**
 * PUT /api/products/:id
 * Partial update. Optionally upload new images (appended to the images array).
 */
router.put(
  '/:id',
  protect,
  upload.array('images', 5),
  preprocessMultipartProduct,
  validate(updateProductSchema),
  productController.updateProduct
);

/**
 * PATCH /api/products/:id/images
 * Append image URLs directly (no file upload — supply raw URLs in JSON body).
 * Body: { "images": ["https://...", "https://..."] }
 */
router.patch('/:id/images', protect, productController.addImages);

/**
 * DELETE /api/products/:id/images
 * Remove a single image URL from the images array.
 * Body: { "url": "https://..." }
 */
router.delete('/:id/images', protect, productController.removeImage);

/** DELETE /api/products/:id — Delete product (checks active orders) */
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router;
