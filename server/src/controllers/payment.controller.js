'use strict';

const paymentService = require('../services/payment.service');
const orderService = require('../services/order.service');
const cartService = require('../services/cart.service');
const deliveryService = require('../services/delivery.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * POST /api/payment/verify
 * Verifies Razorpay signature, deducts stock, creates Order, clears cart, assigns delivery.
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    address,
    cartSnapshot,
  } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, 'Missing required payment verification fields.');
  }

  if (!address || !cartSnapshot || !cartSnapshot.items || cartSnapshot.items.length === 0) {
    throw new ApiError(400, 'Missing address or cart snapshot for order creation.');
  }

  // ── 1. Verify signature ───────────────────────────────────────────────────
  paymentService.verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  // ── 2. Deduct stock atomically ────────────────────────────────────────────
  await orderService.deductStock(cartSnapshot.items);

  // ── 3. Create Order document ──────────────────────────────────────────────
  const order = await orderService.createOrder({
    userId: req.user._id,
    items: cartSnapshot.items,
    totalAmount: cartSnapshot.totalAmount,
    address,
    paymentId: razorpayPaymentId,
    razorpayOrderId,
  });

  // ── 4. Clear cart ─────────────────────────────────────────────────────────
  await cartService.clearCart(req.user._id);

  // ── 5. Assign delivery (non-blocking — don't fail order on delivery error) ─
  deliveryService.assignDelivery(order._id.toString()).catch((err) => {
    logger.error(`[Delivery] Failed to assign delivery for order ${order._id}: ${err.message}`);
  });

  logger.info(`[Payment] Verified — orderId: ${order._id}, paymentId: ${razorpayPaymentId}`);

  return new ApiResponse(200, 'Payment verified. Order placed successfully.', { order }).send(res);
});

/**
 * POST /api/payment/failure
 * Logs failed payment attempts for auditing.
 */
const paymentFailure = asyncHandler(async (req, res) => {
  const { razorpayOrderId, reason } = req.body;

  logger.warn(`[Payment] Failure reported — razorpayOrderId: ${razorpayOrderId}, reason: ${reason}`);

  return new ApiResponse(200, 'Payment failure recorded. You may retry.', {
    razorpayOrderId,
    retryAllowed: true,
  }).send(res);
});

module.exports = { verifyPayment, paymentFailure };
