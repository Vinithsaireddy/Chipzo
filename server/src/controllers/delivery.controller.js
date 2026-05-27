'use strict';

const orderService = require('../services/order.service');
const deliveryService = require('../services/delivery.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/delivery/track/:orderId
 * Returns the latest delivery tracking info for an order belonging to the current user.
 */
const trackDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await orderService.getOrderById(orderId, req.user._id);

  if (order.paymentStatus !== 'paid' && order.paymentMethod !== 'cod') {
    throw new ApiError(400, 'Cannot track delivery for an unpaid order.');
  }

  const trackingInfo = await deliveryService.trackDelivery(orderId);

  if (!trackingInfo) {
    throw new ApiError(404, 'Tracking information not available for this order.');
  }

  return new ApiResponse(200, 'Delivery status fetched successfully', trackingInfo).send(res);
});

/**
 * POST /api/delivery/cancel/:orderId
 * Cancels the delivery/shipment for an order (if eligible).
 */
const cancelDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await orderService.getOrderById(orderId, req.user._id);

  if (order.paymentStatus !== 'paid' && order.paymentMethod !== 'cod') {
    throw new ApiError(400, 'Cannot cancel an unpaid order.');
  }

  if (order.deliveryStatus === 'delivered') {
    throw new ApiError(400, 'Cannot cancel a delivered order.');
  }

  if (order.deliveryStatus === 'cancelled') {
    throw new ApiError(400, 'Order is already cancelled.');
  }

  const cancellableStatuses = deliveryService.CANCELLABLE_STATUSES;
  if (!cancellableStatuses.includes(order.deliveryStatus)) {
    throw new ApiError(
      400,
      `Cannot cancel order in current status: "${deliveryService.STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus}". Eligible statuses: ${cancellableStatuses.map(s => deliveryService.STATUS_LABELS[s]).join(', ')}`
    );
  }

  const result = await deliveryService.cancelDelivery(orderId);

  return new ApiResponse(200, 'Order cancelled successfully.', result).send(res);
});

module.exports = { trackDelivery, cancelDelivery };
