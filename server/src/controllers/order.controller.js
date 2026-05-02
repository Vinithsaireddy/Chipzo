'use strict';

const Cart = require('../models/Cart');
const paymentService = require('../services/payment.service');
const orderService = require('../services/order.service');
const cartService = require('../services/cart.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/orders
 * Validates cart and stock, creates a Razorpay order.
 * Does NOT create a DB Order document — waits for payment verification.
 */
const initiateOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch and populate cart
  const cart = await Cart.findOne({ userId }).populate('items.productId', 'name price stock');

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty.');
  }

  // Validate stock for all items
  const outOfStock = cartService.validateStock(cart.items);
  if (outOfStock.length > 0) {
    const names = outOfStock
      .map((i) => i.productId?.name || 'Unknown product')
      .join(', ');
    throw new ApiError(400, `Insufficient stock for: ${names}`);
  }

  const totalAmount = cartService.computeTotal(cart.items);

  // Create Razorpay order (amount in INR — service converts to paise)
  const receipt = `order_${userId}_${Date.now()}`;
  const rzpOrder = await paymentService.createRazorpayOrder({ amount: totalAmount, receipt });

  return new ApiResponse(201, 'Order initiated. Complete payment to confirm.', {
    razorpayOrderId: rzpOrder.id,
    amount: totalAmount,
    currency: 'INR',
    key_id: process.env.RAZORPAY_KEY_ID,
  }).send(res);
});

/**
 * GET /api/orders
 * Returns all orders for the current user (paginated).
 */
const getOrders = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await orderService.getUserOrders(req.user._id, page, limit);

  return new ApiResponse(200, 'Orders fetched successfully', result.orders, {
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    totalCount: result.totalCount,
    limit: result.limit,
  }).send(res);
});

/**
 * GET /api/orders/:id
 * Returns a single order (only if it belongs to the current user).
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user._id);
  return new ApiResponse(200, 'Order fetched successfully', { order }).send(res);
});

module.exports = { initiateOrder, getOrders, getOrder };
