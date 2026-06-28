'use strict';

const paymentService = require('../services/payment.service');
const orderService = require('../services/order.service');
const cartService = require('../services/cart.service');
const deliveryService = require('../services/delivery.service');
const emailService = require('../services/emailService');
const generateInvoicePdf = require('../utils/generateInvoice');
const whatsappService = require('../services/whatsapp.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const Product = require('../models/Product');
const Order = require('../models/Order');

// computePriceSummary is the single source of truth for pricing
const { computePriceSummary } = require('../services/cart.service');

/**
 * POST /api/payment/verify
 * Verifies Razorpay signature, creates Order, clears cart, assigns delivery.
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

  // Normalize cartSnapshot — support both Array and Object shapes from the client.
  // NOTE: we only use productId and quantity from the client — prices come from DB.
  let items = [];

  if (Array.isArray(cartSnapshot)) {
    items = cartSnapshot;
  } else if (typeof cartSnapshot === 'object') {
    items = cartSnapshot.items || [];
    // cartSnapshot.totalAmount is intentionally ignored — computed server-side below.
  }

  if (items.length === 0) {
    throw new ApiError(400, 'Cart snapshot must contain at least one item.');
  }

  // ── Look up products from DB ──────────────────────────────────────────────
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  const productMap = {};
  products.forEach((p) => {
    productMap[p._id.toString()] = p;
  });

  // ── Build validated items using ONLY DB prices (Fix 2) ────────────────────
  // Client-sent price fields (item.price, item.priceAtPurchase, cartSnapshot.totalAmount)
  // are never used. Only product.price fetched from the database is trusted.
  const validatedItems = items.map((item) => {
    if (!item.productId) {
      throw new ApiError(400, 'Each item in the cart snapshot must have a productId.');
    }
    const product = productMap[item.productId.toString()];
    if (!product) {
      throw new ApiError(404, `Product not found in database: ${item.productId}`);
    }
    return {
      productId: item.productId,
      name: product.name,           // from DB
      price: product.price,         // from DB — client-sent price is ignored
      quantity: item.quantity || 1,
    };
  });

  // ── Compute server-side total using the canonical pricing function (includes delivery fee) ──
  // Wrap items into the shape expected by computePriceSummary:
  // [{ productId: { price }, quantity }]
  const populatedItems = validatedItems.map(item => ({
    productId: { price: item.price },
    quantity: item.quantity,
  }));
  const pricing = computePriceSummary(populatedItems);
  const serverTotal = pricing.total; // subtotal + deliveryFee

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

  // ── 2. Verify Razorpay HMAC signature ─────────────────────────────────────
  paymentService.verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  // ── 3. Verify payment amount against Razorpay (Fix 3) ─────────────────────
  // Fetch the Razorpay order to confirm the amount we created it with matches
  // the server-computed total. This prevents a replay attack where an attacker
  // uses a valid signature from a ₹1 payment to claim a ₹10,000 order.
  const razorpay = require('../config/razorpay');

  const rzpOrder = await razorpay.orders.fetch(razorpayOrderId);
  const expectedAmountPaise = Math.round(serverTotal * 100);
  if (parseInt(rzpOrder.amount, 10) !== expectedAmountPaise) {
    logger.warn(
      `[Payment] Amount mismatch — gateway: ₹${rzpOrder.amount / 100}, ` +
      `server: ₹${serverTotal}, orderId: ${razorpayOrderId}`
    );
    throw new ApiError(400, 'Payment amount mismatch. Order rejected.');
  }

  // ── 4. Verify payment was actually captured (Fix 3) ───────────────────────
  const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);
  if (rzpPayment.status !== 'captured') {
    logger.warn(`[Payment] Payment not captured — status: ${rzpPayment.status}, paymentId: ${razorpayPaymentId}`);
    throw new ApiError(400, 'Payment not captured. Order rejected.');
  }
  if (rzpPayment.order_id !== razorpayOrderId) {
    logger.warn(`[Payment] Payment/order mismatch — paymentId: ${razorpayPaymentId}, orderId: ${razorpayOrderId}`);
    throw new ApiError(400, 'Payment does not belong to this order.');
  }

  // ── 5. Create Order document ──────────────────────────────────────────────
  const order = await orderService.createOrder({
    userId: req.user._id,
    items: validatedItems,
    totalAmount: serverTotal,     // server-computed total (subtotal + delivery)
    deliveryFee: pricing.deliveryFee, // delivery fee snapshot for order records
    address,
    paymentId: razorpayPaymentId,
    razorpayOrderId,
    paymentSignature: razorpaySignature,
  });

  // ── 6. Clear cart ─────────────────────────────────────────────────────────
  await cartService.clearCart(req.user._id);

  // ── 7. Send Order Confirmation Email ──────────────────────────────────────
  generateInvoicePdf(order)
    .then((pdfBuffer) => {
      return emailService.sendOrderConfirmation(req.user.email, req.user.name, order, pdfBuffer);
    })
    .catch((err) => {
      logger.error(`[Order Email Error] Failed to generate/send order confirmation email: ${err.message}`);
    });

  // ── 8. Assign delivery (non-blocking — don't fail order on delivery error) ─
  deliveryService.assignDelivery(order._id.toString()).catch((err) => {
    logger.error(`[Delivery] Failed to assign delivery for order ${order._id}: ${err.message}`);
  });

  // ── 9. Send WhatsApp Notification (non-blocking) ───────────────────────────
  whatsappService.sendOrderNotification(order).catch((err) => {
    logger.error(`[WhatsApp] Failed to trigger order notification for order ${order._id}: ${err.message}`);
  });

  logger.info(`[Payment] Verified — orderId: ${order._id}, paymentId: ${razorpayPaymentId}, total: ₹${serverTotal}`);

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
