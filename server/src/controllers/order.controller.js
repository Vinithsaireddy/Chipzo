'use strict';

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const paymentService = require('../services/payment.service');
const orderService = require('../services/order.service');
const cartService = require('../services/cart.service');
const deliveryService = require('../services/delivery.service');
const emailService = require('../services/emailService');
const generateInvoicePdf = require('../utils/generateInvoice');
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

  // ── Send Order Confirmation Email ──────────────────────────────────────────
  generateInvoicePdf(order)
    .then((pdfBuffer) => {
      return emailService.sendOrderConfirmation(req.user.email, req.user.name, order, pdfBuffer);
    })
    .catch((err) => {
      logger.error(`[Order Email Error] Failed to generate/send order confirmation email: ${err.message}`);
    });

  deliveryService.assignDelivery(order._id.toString()).catch((err) => {
    logger.error(`[Delivery] Failed to assign delivery for order ${order._id}: ${err.message}`);
  });

  return new ApiResponse(201, 'Order placed successfully (Cash on Delivery)', { order }).send(res);
});

/**
 * GET /api/orders/admin
 * Returns all orders in the entire system, paginated, filtered, and searched.
 */
const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  const { page = 1, limit = 10, search, status } = req.query;
  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.min(parseInt(limit, 10), 100);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  // Search by order ID, customer name, or phone number
  if (search && search.trim()) {
    const s = search.trim();
    if (s.match(/^[0-9a-fA-F]{24}$/)) {
      filter._id = s;
    } else {
      filter.$or = [
        { 'address.fullName': { $regex: s, $options: 'i' } },
        { 'address.phone': { $regex: s, $options: 'i' } }
      ];
    }
  }

  // Filter by status (paymentStatus or deliveryStatus)
  if (status && status.trim()) {
    const st = status.trim();
    filter.$or = [
      { paymentStatus: st },
      { deliveryStatus: st }
    ];
  }

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(filter)
  ]);

  return new ApiResponse(200, 'All orders fetched successfully', orders, {
    currentPage: pageNum,
    totalPages: Math.ceil(totalCount / limitNum),
    totalCount,
    limit: limitNum
  }).send(res);
});

/**
 * GET /api/orders/admin/:id
 * Returns complete details for a single order (Admin only).
 */
const getOrderAdmin = asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  const order = await Order.findById(req.params.id)
    .populate('userId', 'name email')
    .lean();

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return new ApiResponse(200, 'Order details fetched successfully', { order }).send(res);
});

/**
 * PUT /api/orders/admin/:id
 * Updates payment Status, delivery status, and tracking ID for a single order (Admin only).
 */
const updateOrderAdmin = asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  const { paymentStatus, deliveryStatus, deliveryTrackingId } = req.body;
  const updates = {};
  
  if (paymentStatus) updates.paymentStatus = paymentStatus;
  if (deliveryStatus) updates.deliveryStatus = deliveryStatus;
  if (deliveryTrackingId !== undefined) updates.deliveryTrackingId = deliveryTrackingId;

  const order = await Order.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  }).populate('userId', 'name email');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // ── Send Delivery Confirmation Email ───────────────────────────────────────
  if (deliveryStatus === 'delivered' && order.userId && order.userId.email) {
    emailService.sendDeliveryConfirmation(order.userId.email, order.userId.name, order).catch((err) => {
      logger.error(`[Delivery Email Error] Failed to send delivery email for order ${order._id}: ${err.message}`);
    });
  }

  return new ApiResponse(200, 'Order status updated successfully', { order }).send(res);
});

/**
 * DELETE /api/orders/admin/:id
 * Deletes/cancels a customer order completely (Admin only).
 */
const deleteOrderAdmin = asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return new ApiResponse(200, 'Order permanently deleted and cancelled successfully', null).send(res);
});

module.exports = { 
  initiateOrder, 
  getOrders, 
  getOrder, 
  createCODOrder,
  getAllOrdersAdmin,
  getOrderAdmin,
  updateOrderAdmin,
  deleteOrderAdmin
};
