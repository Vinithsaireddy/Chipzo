'use strict';

const orderService = require('../services/order.service');
const deliveryService = require('../services/delivery.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/delivery/provider
 * Returns info about the currently active delivery provider.
 */
const getDeliveryProvider = asyncHandler(async (req, res) => {
  return new ApiResponse(200, 'Delivery provider info', {
    provider: 'borzo',
    name: 'Borzo',
    description: 'Borzo (formerly MrSpeedy) — hyperlocal same-day delivery',
    logo: 'https://borzodelivery.com/img/global/new-design/logo.svg',
  }).send(res);
});

/**
 * GET /api/delivery/track/:orderId
 * Returns the latest delivery tracking info for an order belonging to the current user.
 */
const trackDelivery = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await orderService.getOrderById(orderId, req.user._id);

  if (order.paymentStatus !== 'paid') {
    throw new ApiError(400, 'Cannot track delivery for an unpaid order.');
  }

  const trackingInfo = await deliveryService.trackDelivery(orderId);

  if (!trackingInfo) {
    throw new ApiError(404, 'Tracking information not available for this order.');
  }

  return new ApiResponse(200, 'Delivery status fetched successfully', trackingInfo).send(res);
});

module.exports = { trackDelivery, getDeliveryProvider };
