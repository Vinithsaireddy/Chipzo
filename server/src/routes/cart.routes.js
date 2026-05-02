'use strict';

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { addToCartSchema, updateCartItemSchema } = require('../validators/cart.validator');

// All cart routes are protected
router.use(protect);

/** GET /api/cart — Get current user's cart */
router.get('/', cartController.getCart);

/** POST /api/cart/items — Add item to cart */
router.post('/items', validate(addToCartSchema), cartController.addToCart);

/** PUT /api/cart/items/:productId — Update item quantity */
router.put('/items/:productId', validate(updateCartItemSchema), cartController.updateCartItem);

/** DELETE /api/cart/items/:productId — Remove single item */
router.delete('/items/:productId', cartController.removeCartItem);

/** DELETE /api/cart — Clear entire cart */
router.delete('/', cartController.clearCart);

module.exports = router;
