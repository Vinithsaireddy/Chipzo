'use strict';

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const paymentService = require('../services/payment.service');
const orderService = require('../services/order.service');
const cartService = require('../services/cart.service');
const deliveryService = require('../services/delivery.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * POST /api/orders
 * Validates cart and stock, creates a Razorpay order.
 * Does NOT create a DB Order document — waits for payment verification.
 */
const initiateOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  console.log('[Order] initiateOrder called for user:', userId);
  console.log('[Order] User body:', JSON.stringify(req.body));
  console.log('[Order] RAZORPAY_KEY_ID exists:', !!process.env.RAZORPAY_KEY_ID);
  console.log('[Order] RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);

  // Fetch and populate cart
  const cart = await Cart.findOne({ userId }).populate('items.productId', 'name price stock');

  if (!cart || cart.items.length === 0) {
    console.log('[Order] Cart is empty');
    throw new ApiError(400, 'Your cart is empty.');
  }
  console.log('[Order] Cart items count:', cart.items.length);

  // Validate stock for all items
  const outOfStock = cartService.validateStock(cart.items);
  if (outOfStock.length > 0) {
    const names = outOfStock
      .map((i) => i.productId?.name || 'Unknown product')
      .join(', ');
    console.log('[Order] Out of stock items:', names);
    throw new ApiError(400, `Insufficient stock for: ${names}`);
  }

  const totalAmount = cartService.computeTotal(cart.items);
  console.log('[Order] Total amount (INR):', totalAmount);

  // Create Razorpay order (amount in INR — service converts to paise)
  const receipt = `rcpt_${userId.toString().slice(-6)}_${Date.now()}`;
  console.log('[Order] Creating Razorpay order with receipt:', receipt);
  let rzpOrder;
  try {
    rzpOrder = await paymentService.createRazorpayOrder({ amount: totalAmount, receipt });
    console.log('[Order] Razorpay order created:', rzpOrder.id);
  } catch (rzpErr) {
    console.log('[Order] Razorpay order creation FAILED:', rzpErr.message);
    console.log('[Order] Full error:', rzpErr);
    throw rzpErr;
  }

  const response = {
    razorpayOrderId: rzpOrder.id,
    amount: totalAmount,
    currency: 'INR',
    key_id: process.env.RAZORPAY_KEY_ID,
  };
  console.log('[Order] Sending response:', JSON.stringify(response));

  return new ApiResponse(201, 'Order initiated. Complete payment to confirm.', response).send(res);
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

/**
 * POST /api/orders/cod
 * Creates a direct order for Cash on Delivery (no Razorpay).
 */
const createCODOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { address } = req.body;

  if (!address) throw new ApiError(400, 'Delivery address is required.');

  const cart = await Cart.findOne({ userId }).populate('items.productId', 'name price stock');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty.');

  const outOfStock = cartService.validateStock(cart.items);
  if (outOfStock.length > 0) {
    const names = outOfStock.map((i) => i.productId?.name || 'Unknown product').join(', ');
    throw new ApiError(400, `Insufficient stock for: ${names}`);
  }

  const items = cart.items.map((item) => {
    const product = item.productId;
    return {
      productId: product._id,
      name: product.name,
      price: product.price || 0,
      quantity: item.quantity,
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  await orderService.deductStock(items);

  const order = await orderService.createOrder({
    userId,
    items,
    totalAmount,
    address,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
  });

  await cartService.clearCart(userId);

  deliveryService.assignDelivery(order._id.toString()).catch((err) => {
    logger.error(`[Delivery] Failed to assign delivery for order ${order._id}: ${err.message}`);
  });

  return new ApiResponse(201, 'Order placed successfully (Cash on Delivery)', { order }).send(res);
});

module.exports = { initiateOrder, getOrders, getOrder, createCODOrder };
