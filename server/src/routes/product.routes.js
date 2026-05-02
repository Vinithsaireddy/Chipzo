'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { createProductSchema, updateProductSchema } = require('../validators/product.validator');

// ── Multer: in-memory storage (buffer passed to Cloudflare service) ───────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
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

/** GET /api/products/:id — Single product */
router.get('/:id', productController.getProduct);

// ── Protected routes ──────────────────────────────────────────────────────────

/**
 * POST /api/products — Create product with image upload
 * Note: validate() runs on req.body (text fields from multipart) after multer parses them.
 */
router.post(
  '/',
  protect,
  upload.single('image'),
  validate(createProductSchema),
  productController.createProduct
);

/** PUT /api/products/:id — Partial update, optional image replacement */
router.put(
  '/:id',
  protect,
  upload.single('image'),
  validate(updateProductSchema),
  productController.updateProduct
);

/** DELETE /api/products/:id — Delete product (checks active orders) */
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router;
