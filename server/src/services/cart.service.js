'use strict';

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

/**
 * Returns the current user's cart with populated product details.
 * @param {string} userId
 */
const getCart = async (userId) => {
  const cart = await Cart.findOne({ userId })
    .populate('items.productId', 'name price imageUrl stock category')
    .lean({ virtuals: true });

  if (!cart) {
    return { userId, items: [], totalPrice: 0 };
  }

  const totalPrice = computeTotal(cart.items);
  return { ...cart, totalPrice };
};

/**
 * Adds a product to the cart or increments quantity if already present.
 * Validates: product exists, sufficient stock.
 *
 * @param {string} userId
 * @param {string} productId
 * @param {number} quantity
 */
const addToCart = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  // Fetch existing cart (if any) to compute the resulting total quantity
  const existingCart = await Cart.findOne({ userId });
  const existingItem = existingCart?.items.find(
    (i) => i.productId.toString() === productId
  );
  const currentQty = existingItem ? existingItem.quantity : 0;
  const newTotal = currentQty + quantity;

  if (newTotal > product.stock) {
    throw new ApiError(
      400,
      `Insufficient stock. Available: ${product.stock}, in cart: ${currentQty}, requested: ${quantity}.`
    );
  }

  const cart = await Cart.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: { userId },
    },
    { upsert: true, new: true }
  );

  if (existingItem) {
    // Increment quantity for existing item
    await Cart.updateOne(
      { userId, 'items.productId': productId },
      { $inc: { 'items.$.quantity': quantity } }
    );
  } else {
    // Push new item
    await Cart.updateOne(
      { userId },
      { $push: { items: { productId, quantity } } }
    );
  }

  return getCart(userId);
};

/**
 * Updates the quantity of a specific cart item.
 * @param {string} userId
 * @param {string} productId
 * @param {number} quantity
 */
const updateCartItem = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  if (quantity > product.stock) {
    throw new ApiError(400, `Insufficient stock. Available: ${product.stock}.`);
  }

  const result = await Cart.findOneAndUpdate(
    { userId, 'items.productId': productId },
    { $set: { 'items.$.quantity': quantity } },
    { new: true }
  );

  if (!result) {
    throw new ApiError(404, 'Item not found in cart');
  }

  return getCart(userId);
};

/**
 * Removes a single item from the cart.
 * @param {string} userId
 * @param {string} productId
 */
const removeCartItem = async (userId, productId) => {
  const result = await Cart.findOneAndUpdate(
    { userId },
    { $pull: { items: { productId } } },
    { new: true }
  );

  if (!result) {
    throw new ApiError(404, 'Cart not found');
  }

  return getCart(userId);
};

/**
 * Clears all items from the user's cart (used post-order).
 * @param {string} userId
 */
const clearCart = async (userId) => {
  await Cart.findOneAndUpdate(
    { userId },
    { $set: { items: [] } },
    { upsert: true }
  );
};

/**
 * Computes the total price of a populated cart's items.
 * @param {Array} items - Populated cart items [{ productId: Product, quantity }]
 * @returns {number}
 */
const computeTotal = (items = []) =>
  items.reduce((total, item) => {
    if (item.productId && typeof item.productId === 'object') {
      return total + (item.productId.price || 0) * item.quantity;
    }
    return total;
  }, 0);

/**
 * Validates that each cart item has sufficient stock.
 * @param {Array} items - Populated cart items
 * @returns {Array} - Array of out-of-stock items (empty = all good)
 */
const validateStock = (items = []) => {
  return items.filter((item) => {
    const product = item.productId;
    if (!product || typeof product !== 'object') return true; // Not populated — flag as issue
    return item.quantity > product.stock;
  });
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  computeTotal,
  validateStock,
};
