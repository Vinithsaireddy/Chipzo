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

// ── Public routes ─────────────────────────────────────────────────────────────

/** GET /api/products — Paginated product listing with filters */
router.get('/', productController.getProducts);

/** GET /api/products/slug/:slug — Lookup by inventory slug (e.g. "arduino_uno_r3") */
router.get('/slug/:slug', productController.getProductBySlug);

/** GET /api/products/:id — Single product by MongoDB _id */
router.get('/:id', productController.getProduct);

// ── Protected routes ──────────────────────────────────────────────────────────

/**
 * POST /api/products
 * Creates a new product. Images are optional — up to 5 files via multipart field "images".
 */
router.post(
  '/',
  protect,
  upload.array('images', 5),
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
