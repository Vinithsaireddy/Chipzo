'use strict';

const cartService = require('../services/cart.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/cart
 * Returns the current user's cart with populated products and computed total.
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  return new ApiResponse(200, 'Cart fetched successfully', { cart }).send(res);
});

/**
 * POST /api/cart/items
 * Adds a product to the cart (or increments if already present).
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addToCart(req.user._id, productId, quantity);
  return new ApiResponse(200, 'Item added to cart', { cart }).send(res);
});

/**
 * PUT /api/cart/items/:productId
 * Updates quantity of a specific cart item.
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateCartItem(
    req.user._id,
    req.params.productId,
    req.body.quantity
  );
  return new ApiResponse(200, 'Cart item updated', { cart }).send(res);
});

/**
 * DELETE /api/cart/items/:productId
 * Removes a single item from the cart.
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCartItem(req.user._id, req.params.productId);
  return new ApiResponse(200, 'Item removed from cart', { cart }).send(res);
});

/**
 * DELETE /api/cart
 * Clears the entire cart.
 */
const clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user._id);
  return new ApiResponse(200, 'Cart cleared', null).send(res);
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
