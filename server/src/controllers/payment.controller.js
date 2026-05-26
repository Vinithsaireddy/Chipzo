'use strict';

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

const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * POST /api/payment/verify
 * Verifies Razorpay signature, deducts stock, creates Order, clears cart, assigns delivery.
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpayOrderId: rzpOrderId,
    razorpayPaymentId: rzpPaymentId,
    razorpaySignature: rzpSignature,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    address,
    cartSnapshot,
  } = req.body;

  const razorpayOrderId = rzpOrderId || razorpay_order_id;
  const razorpayPaymentId = rzpPaymentId || razorpay_payment_id;
  const razorpaySignature = rzpSignature || razorpay_signature;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, 'Missing required payment verification fields.');
  }

  if (!address || !cartSnapshot) {
    throw new ApiError(400, 'Missing address or cart snapshot for order creation.');
  }

  // Normalize cartSnapshot to support both Array and Object structures
  let items = [];
  let totalAmount = 0;

  if (Array.isArray(cartSnapshot)) {
    items = cartSnapshot;
  } else if (typeof cartSnapshot === 'object') {
    items = cartSnapshot.items || [];
    totalAmount = cartSnapshot.totalAmount || 0;
  }

  if (items.length === 0) {
    throw new ApiError(400, 'Cart snapshot must contain at least one item.');
  }

  // Look up products to ensure they exist and populate missing fields (like name, price)
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  
  const productMap = {};
  products.forEach((p) => {
    productMap[p._id.toString()] = p;
  });

  const validatedItems = items.map((item) => {
    if (!item.productId) {
      throw new ApiError(400, 'Each item in the cart snapshot must have a productId.');
    }
    const product = productMap[item.productId.toString()];
    if (!product) {
      throw new ApiError(404, `Product not found in database: ${item.productId}`);
    }
    const price = item.price || item.priceAtPurchase || product.price || 0;
    return {
      productId: item.productId,
      name: item.name || product.name,
      price: price,
      quantity: item.quantity || 1,
    };
  });

  // Calculate total amount if not already populated
  if (!totalAmount) {
    totalAmount = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  // ── 1. Duplicate payment prevention ────────────────────────────────────────
  const existingPayment = await Order.findOne({ paymentId: razorpayPaymentId });
  if (existingPayment) {
    logger.warn(`[Payment] Duplicate payment attempt blocked — paymentId: ${razorpayPaymentId}`);
    return new ApiResponse(200, 'Payment already verified.', { order: existingPayment }).send(res);
  }

  const existingOrder = await Order.findOne({ razorpayOrderId });
  if (existingOrder) {
    logger.warn(`[Payment] Duplicate Razorpay order blocked — rzpOrderId: ${razorpayOrderId}`);
    return new ApiResponse(200, 'Order already placed for this payment.', { order: existingOrder }).send(res);
  }

  // ── 2. Verify signature ───────────────────────────────────────────────────
  paymentService.verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  // ── 3. Deduct stock atomically ────────────────────────────────────────────
  await orderService.deductStock(validatedItems);

  // ── 4. Create Order document ──────────────────────────────────────────────
  const order = await orderService.createOrder({
    userId: req.user._id,
    items: validatedItems,
    totalAmount,
    address,
    paymentId: razorpayPaymentId,
    razorpayOrderId,
    paymentSignature: razorpaySignature,
  });

  // ── 5. Clear cart ─────────────────────────────────────────────────────────
  await cartService.clearCart(req.user._id);

  // ── 5.5 Send Order Confirmation Email ──────────────────────────────────────
  generateInvoicePdf(order)
    .then((pdfBuffer) => {
      return emailService.sendOrderConfirmation(req.user.email, req.user.name, order, pdfBuffer);
    })
    .catch((err) => {
      logger.error(`[Order Email Error] Failed to generate/send order confirmation email: ${err.message}`);
    });

  // ── 6. Assign delivery (non-blocking — don't fail order on delivery error) ─
  deliveryService.assignDelivery(order._id.toString()).catch((err) => {
    logger.error(`[Delivery] Failed to assign delivery for order ${order._id}: ${err.message}`);
  });

  logger.info(`[Payment] Verified — orderId: ${order._id}, paymentId: ${razorpayPaymentId}`);

  return new ApiResponse(200, 'Payment verified. Order placed successfully.', { order }).send(res);
});

/**
 * POST /api/payment/failure
 * Logs failed payment attempts for auditing and tracking.
 */
const paymentFailure = asyncHandler(async (req, res) => {
  const {
    razorpayOrderId: rzpOrderId,
    razorpay_order_id,
    razorpayPaymentId,
    reason,
    step,
  } = req.body;
  const razorpayOrderId = rzpOrderId || razorpay_order_id;

  logger.warn(
    `[Payment] Failure reported — razorpayOrderId: ${razorpayOrderId}, ` +
    `paymentId: ${razorpayPaymentId || 'N/A'}, step: ${step || 'N/A'}, reason: ${reason}`
  );

  // Mark the Razorpay order as failed if the order document exists
  if (razorpayOrderId) {
    try {
      await Order.updateOne(
        { razorpayOrderId },
        { $set: { paymentStatus: 'failed' } }
      );
    } catch (dbErr) {
      logger.error(`[Payment] Failed to update order failure status: ${dbErr.message}`);
    }
  }

  return new ApiResponse(200, 'Payment failure recorded. You may retry.', {
    razorpayOrderId,
    razorpayPaymentId: razorpayPaymentId || null,
    retryAllowed: true,
  }).send(res);
});

module.exports = { verifyPayment, paymentFailure };
