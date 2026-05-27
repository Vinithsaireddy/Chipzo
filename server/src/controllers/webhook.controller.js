'use strict';

const deliveryService = require('../services/delivery.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * POST /api/webhook/shiprocket
 * Receives shipment status updates from Shiprocket.
 * This endpoint should be configured in Shiprocket dashboard as a webhook URL.
 */
const shiprocketWebhook = asyncHandler(async (req, res) => {
  const payload = req.body;

  logger.info(`[Webhook] Received Shiprocket webhook: ${JSON.stringify(payload).slice(0, 300)}`);

  if (!payload || (!payload.shipment_id && !payload.awb && !payload.order_id)) {
    logger.warn('[Webhook] Invalid payload — missing shipment_id or awb');
    return new ApiResponse(400, 'Invalid webhook payload').send(res);
  }

  await deliveryService.handleWebhook(payload);

  return new ApiResponse(200, 'Webhook processed successfully').send(res);
});

module.exports = { shiprocketWebhook };
