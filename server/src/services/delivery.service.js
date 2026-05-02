'use strict';

const { v4: uuidv4 } = require('uuid');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const env = require('../config/env');

// ─── Delivery status progression (mock) ──────────────────────────────────────
const MOCK_STATUSES = ['assigned', 'in_transit', 'delivered'];
const STATUS_TRANSITION_MS = 2 * 60 * 1000; // 2 minutes per stage (demo-friendly)

/**
 * Assigns a delivery for an order.
 * Uses Rapido API if RAPIDO_API_KEY is set, otherwise uses mock.
 *
 * @param {string} orderId
 * @returns {Promise<{ trackingId: string, status: string }>}
 */
const assignDelivery = async (orderId) => {
  if (env.RAPIDO_API_KEY) {
    return assignRapidoDelivery(orderId);
  }
  return assignMockDelivery(orderId);
};

/**
 * Tracks the current delivery status of an order.
 * @param {string} orderId
 * @returns {Promise<object>}
 */
const trackDelivery = async (orderId) => {
  const order = await Order.findById(orderId).lean();
  if (!order) return null;

  if (env.RAPIDO_API_KEY && order.deliveryTrackingId) {
    return trackRapidoDelivery(order.deliveryTrackingId);
  }
  return trackMockDelivery(order);
};

// ─── Mock implementations ─────────────────────────────────────────────────────

const assignMockDelivery = async (orderId) => {
  const trackingId = `VOLTEX-${uuidv4().slice(0, 8).toUpperCase()}`;
  logger.info(`[Delivery] Mock assigned: orderId=${orderId}, trackingId=${trackingId}`);

  await Order.findByIdAndUpdate(orderId, {
    deliveryStatus: 'assigned',
    deliveryTrackingId: trackingId,
  });

  return { trackingId, status: 'assigned' };
};

const trackMockDelivery = (order) => {
  const minutesSinceOrder = (Date.now() - new Date(order.createdAt).getTime()) / STATUS_TRANSITION_MS;
  const stageIndex = Math.min(Math.floor(minutesSinceOrder), MOCK_STATUSES.length - 1);
  const currentStatus = MOCK_STATUSES[stageIndex];

  const mockLocations = {
    assigned: 'Dispatch Center, Bengaluru',
    in_transit: 'In transit — last seen at Electronic City, Bengaluru',
    delivered: 'Delivered to your address',
  };

  const estimatedDelivery = new Date(
    new Date(order.createdAt).getTime() + STATUS_TRANSITION_MS * MOCK_STATUSES.length
  ).toISOString();

  return {
    deliveryStatus: currentStatus,
    trackingId: order.deliveryTrackingId || 'N/A',
    estimatedDelivery,
    currentLocation: mockLocations[currentStatus] || 'Unknown',
    isMocked: true,
  };
};

// ─── Real Rapido implementations ──────────────────────────────────────────────

const assignRapidoDelivery = async (orderId) => {
  // Lazy import to avoid loading node-fetch when not needed
  const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

  try {
    const response = await fetch(`${env.RAPIDO_BASE_URL}/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RAPIDO_API_KEY}`,
      },
      body: JSON.stringify({ orderId }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.warn(`[Rapido] Assign failed: ${JSON.stringify(data)}`);
      // Fall back to mock
      return assignMockDelivery(orderId);
    }

    const trackingId = data.trackingId || data.delivery_id;
    await Order.findByIdAndUpdate(orderId, {
      deliveryStatus: 'assigned',
      deliveryTrackingId: trackingId,
    });

    return { trackingId, status: 'assigned' };
  } catch (err) {
    logger.error(`[Rapido] API error: ${err.message}. Falling back to mock.`);
    return assignMockDelivery(orderId);
  }
};

const trackRapidoDelivery = async (trackingId) => {
  const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

  try {
    const response = await fetch(`${env.RAPIDO_BASE_URL}/deliveries/${trackingId}`, {
      headers: {
        Authorization: `Bearer ${env.RAPIDO_API_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      logger.warn(`[Rapido] Track failed: ${JSON.stringify(data)}`);
      return { deliveryStatus: 'unknown', trackingId, error: 'Tracking unavailable' };
    }

    return {
      deliveryStatus: data.status,
      trackingId,
      estimatedDelivery: data.estimatedDelivery,
      currentLocation: data.currentLocation,
      isMocked: false,
    };
  } catch (err) {
    logger.error(`[Rapido] Track API error: ${err.message}`);
    return { deliveryStatus: 'unknown', trackingId, error: 'Tracking unavailable' };
  }
};

module.exports = { assignDelivery, trackDelivery };
