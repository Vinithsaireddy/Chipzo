'use strict';

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId })
    .populate('items.productId', 'name price images category id specifications')
    .lean({ virtuals: true });

  if (!cart) {
    return { userId, items: [], totalPrice: 0 };
  }

  const staleItems = cart.items.filter(i => !i.productId || !i.productId.name)
  if (staleItems.length > 0) {
    const staleIds = staleItems.map(i => i._id || i.productId)
    await Cart.updateOne(
      { userId },
      { $pull: { items: { _id: { $in: staleIds } } } }
    )
    cart.items = cart.items.filter(i => i.productId && i.productId.name)
  }

  const totalPrice = computeTotal(cart.items);
  return { ...cart, totalPrice };
};

/**
 * Adds a product to the cart or increments quantity if already present.
 * Validates: product exists.
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

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  computeTotal,
};
