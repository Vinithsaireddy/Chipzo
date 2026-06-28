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

/**
 * Returns the tiered delivery fee based on the product subtotal.
 * This is the canonical delivery fee logic — shared by cart preview,
 * order initiation, and payment verification.
 *
 * Tiers:
 *   subtotal >= ₹1000  → ₹0 (Free Delivery)
 *   subtotal >= ₹200   → ₹59
 *   subtotal < ₹200    → ₹100
 *
 * @param {number} subtotal
 * @returns {number}
 */
const computeDeliveryFee = (subtotal) => {
  if (subtotal >= 1000) return 0;
  if (subtotal >= 200) return 59;
  return 100;
};

/**
 * Computes a full price breakdown for a populated cart.
 * This is the single authoritative pricing function used by:
 *   - GET /api/orders/price-summary  (cart page / checkout page display)
 *   - POST /api/orders               (Razorpay order creation amount)
 *   - POST /api/payment/verify       (server-side amount tamper check)
 *
 * @param {Array} populatedItems - Populated cart items [{ productId: Product, quantity }]
 * @param {number} [discountAmount=0] - Applied coupon discount (future use)
 * @returns {{ subtotal: number, deliveryFee: number, discountAmount: number, total: number }}
 */
const computePriceSummary = (populatedItems = [], discountAmount = 0) => {
  const subtotal = computeTotal(populatedItems);
  const deliveryFee = computeDeliveryFee(subtotal);
  const discount = Math.min(discountAmount, subtotal); // can't discount more than subtotal
  const total = Number((subtotal + deliveryFee - discount).toFixed(2));
  return { subtotal, deliveryFee, discountAmount: discount, total };
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  computeTotal,
  computeDeliveryFee,
  computePriceSummary,
};
