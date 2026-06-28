'use strict';

/**
 * delivery.service.js
 *
 * Thin provider-routing layer.
 * Currently Borzo is the only supported delivery provider.
 * All delivery logic lives in borzo.service.js.
 */

const Order = require('../models/Order');
const logger = require('../utils/logger');
const { STATUS_LABELS } = require('../constants/delivery.constants');

// ─── Lazily-loaded Borzo service (avoids circular-dep issues) ─────────────────
let _borzoService = null;
function getBorzoService() {
  if (!_borzoService) {
    _borzoService = require('./borzo.service');
  }
  return _borzoService;
}

// ─── Assign delivery via Borzo ─────────────────────────────────────────────────

const assignDelivery = async (orderId) => {
  logger.info(`[Delivery] Assigning delivery via Borzo for order ${orderId}`);

  // Record the provider on the order so tracking can identify it later
  await Order.findByIdAndUpdate(orderId, { deliveryProvider: 'borzo' });

  return getBorzoService().assignBorzoDelivery(orderId);
};

// ─── Track delivery via Borzo ──────────────────────────────────────────────────

const trackDelivery = async (orderId) => {
  return getBorzoService().trackBorzoDelivery(orderId);
};

// ─── Borzo webhook handler (exposed to webhook.controller) ─────────────────────

const handleBorzoWebhook = (...args) => getBorzoService().handleBorzoWebhook(...args);

module.exports = {
  assignDelivery,
  trackDelivery,
  handleBorzoWebhook,
  STATUS_LABELS,
};
