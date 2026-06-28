'use strict';

const deliveryService = require('../services/delivery.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * POST /api/webhook/borzo
 * Receives real-time delivery status updates from Borzo.
 * Configure the Callback URL in your Borzo Business dashboard → Personal Cabinet → Integration.
 * Borzo sends: order_created, order_changed, delivery_created, delivery_changed events.
 */
const borzoWebhook = asyncHandler(async (req, res) => {
  const payload = req.body;

  logger.info(`[Borzo Webhook] Received event: ${payload?.event_type || 'unknown'} ${JSON.stringify(payload).slice(0, 300)}`);

  if (!payload || (!payload.order && !payload.delivery)) {
    logger.warn('[Borzo Webhook] Invalid payload — missing order or delivery object');
    return new ApiResponse(400, 'Invalid Borzo webhook payload').send(res);
  }

  const result = await deliveryService.handleBorzoWebhook(payload);

  return new ApiResponse(200, 'Borzo webhook processed successfully', result || null).send(res);
});

module.exports = { borzoWebhook };
