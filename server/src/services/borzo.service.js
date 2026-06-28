'use strict';

/**
 * Borzo Business API delivery service (v1.8 — India).
 * Handles order creation, tracking, cancellation, and webhook processing.
 *
 * API Base: https://robotapitest-in.borzodelivery.com/api/business/1.8  (test)
 *           https://robot-in.borzodelivery.com/api/business/1.8         (production)
 *
 * Auth: X-DV-Auth-Token header
 */

const Order = require('../models/Order');
const logger = require('../utils/logger');
const env = require('../config/env');
const { STATUS_LABELS } = require('../constants/delivery.constants');
const { BORZO_STATUS_MAP, BORZO_VEHICLE_TYPE, BORZO_ORDER_TYPES } = require('../constants/borzo.constants');

const BORZO_BASE = env.BORZO_BASE_URL;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ─── Borzo HTTP request wrapper ──────────────────────────────────────────────

async function borzoRequest(path, options = {}) {
  if (!env.BORZO_API_KEY) {
    throw new Error('BORZO_API_KEY is not configured.');
  }

  const url = `${BORZO_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DV-Auth-Token': env.BORZO_API_KEY,
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  let data;
  try {
    data = await res.json();
  } catch {
    const text = await res.text().catch(() => '');
    throw new Error(`Borzo API: non-JSON response ${res.status}: ${text.slice(0, 200)}`);
  }

  if (!res.ok || data.is_successful === false) {
    const errMsgs = (data.errors || []).join(', ') || `HTTP ${res.status}`;
    const paramErrors = data.parameter_errors ? JSON.stringify(data.parameter_errors) : '';
    logger.error(`[Borzo] API error ${res.status} for ${options.method || 'GET'} ${path}: ${errMsgs} ${paramErrors}`);
    throw new Error(`Borzo API error: ${errMsgs || res.status}`);
  }

  return data;
}

// ─── Retry wrapper ───────────────────────────────────────────────────────────

async function withRetry(fn, context = 'API call') {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      logger.warn(`[Borzo] ${context} attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }
  throw lastError;
}

// ─── Add delivery history helper ─────────────────────────────────────────────

async function addDeliveryHistory(orderId, status, location = '', description = '') {
  return Order.findByIdAndUpdate(orderId, {
    $push: {
      deliveryHistory: {
        status,
        location,
        description,
        updatedAt: new Date(),
      },
    },
  });
}

// ─── Calculate delivery price ─────────────────────────────────────────────────

async function calculateOrder(pickupAddress, deliveryAddress, pickupPhone, deliveryPhone) {
  try {
    const payload = {
      matter: 'Electronics',
      vehicle_type_id: BORZO_VEHICLE_TYPE.MOTORBIKE,
      type: BORZO_ORDER_TYPES.STANDARD,
      points: [
        {
          address: pickupAddress,
          contact_person: { phone: pickupPhone, name: env.BORZO_PICKUP_NAME },
          type: 'pickup',
        },
        {
          address: deliveryAddress,
          contact_person: { phone: deliveryPhone, name: 'Customer' },
          type: 'delivery',
        },
      ],
    };

    const data = await borzoRequest('/calculate-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return data;
  } catch (err) {
    logger.warn(`[Borzo] Price calculation failed: ${err.message}`);
    return null;
  }
}

// ─── Create Borzo delivery order ──────────────────────────────────────────────

async function createBorzoOrder(order) {
  if (!order) return null;

  return withRetry(async () => {
    const addr = order.address || {};

    // Build full delivery address string
    const deliveryAddressParts = [
      addr.house,
      addr.street,
      addr.landmark,
      addr.city,
      addr.state,
      addr.pincode,
      'India',
    ].filter(Boolean);
    const deliveryAddress = deliveryAddressParts.join(', ');

    // Borzo needs phone in format: 10 digit (strip country code if present)
    const cleanPhone = (phone = '') => {
      const digits = phone.replace(/\D/g, '');
      // If number starts with 91 and is 12 digits, strip the 91 prefix
      if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
      // If 10-digit, return as-is
      if (digits.length === 10) return digits;
      return digits.slice(-10);
    };

    const deliveryPhone = cleanPhone(addr.phone || '');
    const pickupPhone = cleanPhone(env.BORZO_PICKUP_PHONE || '');

    const pickupAddress = `${env.BORZO_PICKUP_ADDRESS}, India`;

    const payload = {
      matter: `Electronics order #${order._id.toString().slice(-8).toUpperCase()}`,
      vehicle_type_id: BORZO_VEHICLE_TYPE.MOTORBIKE,
      type: BORZO_ORDER_TYPES.STANDARD,
      is_client_notification_enabled: true,
      // Points: [0] = pickup, [1] = delivery
      points: [
        {
          address: pickupAddress,
          contact_person: {
            phone: pickupPhone,
            name: env.BORZO_PICKUP_NAME,
          },
          note: 'Please collect the electronics parcel from Chipzo store.',
          client_order_id: `CHIPZO-${order._id.toString().slice(-8).toUpperCase()}`,
        },
        {
          address: deliveryAddress,
          contact_person: {
            phone: deliveryPhone,
            name: addr.fullName || 'Customer',
          },
          note: addr.landmark ? `Near ${addr.landmark}` : '',
          // Note: is_cod_cash_voucher_required is NOT set here because:
          // 1. Chipzo COD is collected by the platform, not Borzo
          // 2. Borzo COD requires a separate agreement with Borzo
        },
      ],
    };

    logger.info(`[Borzo] Creating order for: ${order._id}, pickup: ${pickupAddress}, delivery: ${deliveryAddress}`);

    const data = await borzoRequest('/create-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const borzoOrder = data.order || {};
    const borzoOrderId = borzoOrder.order_id || borzoOrder.id || null;
    const courierName = borzoOrder.courier?.name || null;
    const courierPhone = borzoOrder.courier?.phone || null;
    const estimatedFinish = borzoOrder.delivery_time_from || borzoOrder.required_finish_datetime || null;

    if (borzoOrderId) {
      const updateFields = {
        shipmentId: String(borzoOrderId),
        deliveryStatus: 'order_confirmed',
        deliveryProvider: 'borzo',
      };

      if (courierName) updateFields['courierDetails.name'] = courierName;
      if (courierPhone) updateFields['courierDetails.phone'] = courierPhone;
      if (estimatedFinish) updateFields.estimatedDelivery = new Date(estimatedFinish * 1000);

      await Order.findByIdAndUpdate(order._id, updateFields);
      await addDeliveryHistory(
        order._id,
        'order_confirmed',
        pickupAddress,
        `Borzo delivery order created (ID: ${borzoOrderId})`
      );
      logger.info(`[Borzo] Order created: chipzo=${order._id}, borzo=${borzoOrderId}`);
    }

    return data;
  }, 'createBorzoOrder');
}

// ─── Get courier real-time location ──────────────────────────────────────────

async function getCourierLocation(order) {
  if (!order || !order.shipmentId) return null;
  try {
    const data = await borzoRequest(`/courier?order_id=${order.shipmentId}`);
    return data.courier || null;
  } catch (err) {
    logger.warn(`[Borzo] Could not fetch courier location: ${err.message}`);
    return null;
  }
}

// ─── Track order via Borzo orders list ───────────────────────────────────────

async function trackBorzoOrder(order) {
  if (!order) return null;

  if (order.deliveryStatus === 'cancelled' || order.deliveryStatus === 'failed_delivery') {
    return buildTrackingResponse(order);
  }

  if (order.shipmentId) {
    try {
      const data = await borzoRequest(`/orders?order_id=${order.shipmentId}`);

      const orders = data.orders || [];
      const borzoOrder = orders.find(o => String(o.order_id) === String(order.shipmentId)) || orders[0];

      if (borzoOrder) {
        const borzoStatus = borzoOrder.status || '';
        const mappedStatus = BORZO_STATUS_MAP[borzoStatus] || order.deliveryStatus;

        const courier = borzoOrder.courier || {};
        const courierName = courier.name || order.courierDetails?.name || '';
        const courierPhone = courier.phone || order.courierDetails?.phone || '';
        const estimatedFinish = borzoOrder.delivery_time_to || borzoOrder.required_finish_datetime || null;

        const updateFields = {};
        if (mappedStatus && mappedStatus !== order.deliveryStatus) {
          updateFields.deliveryStatus = mappedStatus;
        }
        if (courierName && courierName !== order.courierDetails?.name) {
          updateFields['courierDetails.name'] = courierName;
        }
        if (courierPhone && courierPhone !== order.courierDetails?.phone) {
          updateFields['courierDetails.phone'] = courierPhone;
        }
        if (estimatedFinish) {
          const etd = new Date(estimatedFinish * 1000);
          updateFields.estimatedDelivery = etd;
        }

        if (Object.keys(updateFields).length > 0) {
          await Order.findByIdAndUpdate(order._id, updateFields);
        }

        if (mappedStatus && mappedStatus !== order.deliveryStatus) {
          const pointAddress = borzoOrder.points?.[1]?.address || '';
          await addDeliveryHistory(
            order._id,
            mappedStatus,
            pointAddress,
            `Borzo status: ${borzoStatus}`
          );
        }
      }

      return buildTrackingResponse(order);
    } catch (err) {
      logger.warn(`[Borzo] Track failed for ${order._id}, returning DB state: ${err.message}`);
      return buildTrackingResponse(order);
    }
  }

  return buildTrackingResponse(order);
}

// ─── Build tracking response ──────────────────────────────────────────────────

function buildTrackingResponse(order) {
  const history = (order.deliveryHistory || []).sort(
    (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)
  );

  return {
    orderId: order._id,
    deliveryStatus: order.deliveryStatus,
    statusLabel: STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus,
    trackingId: order.deliveryTrackingId || order.shipmentId,
    shipmentId: order.shipmentId,
    provider: 'borzo',
    courierDetails: order.courierDetails || {},
    estimatedDelivery: order.estimatedDelivery,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    deliveryError: order.deliveryError || null,
    history: history.map((h) => ({
      status: h.status,
      statusLabel: STATUS_LABELS[h.status] || h.status,
      location: h.location,
      description: h.description,
      updatedAt: h.updatedAt,
    })),
  };
}

// ─── Borzo webhook handler ────────────────────────────────────────────────────

async function handleBorzoWebhook(payload) {
  try {
    /**
     * Borzo sends either:
     *  - order_created / order_changed  → { event_type, order: { order_id, status, ... } }
     *  - delivery_created / delivery_changed → { event_type, delivery: { order_id, status, ... } }
     */
    const eventType = payload.event_type || '';
    const borzoOrder = payload.order || payload.delivery || {};
    const borzoOrderId = borzoOrder.order_id || borzoOrder.id || null;
    const status = borzoOrder.status || '';
    const mappedStatus = BORZO_STATUS_MAP[status] || '';
    const courier = borzoOrder.courier || {};
    const courierName = courier.name || '';
    const courierPhone = courier.phone || '';

    logger.info(`[Borzo Webhook] Received event: ${eventType}, borzoOrderId: ${borzoOrderId}, status: ${status}`);

    if (!borzoOrderId) {
      logger.warn('[Borzo Webhook] No order_id in payload');
      return;
    }

    // Find the Chipzo order using Borzo's order ID stored in shipmentId
    const order = await Order.findOne({ shipmentId: String(borzoOrderId) });

    if (!order) {
      logger.warn(`[Borzo Webhook] No order found for borzoOrderId: ${borzoOrderId}`);
      return;
    }

    const updateFields = {};

    if (mappedStatus && mappedStatus !== order.deliveryStatus) {
      updateFields.deliveryStatus = mappedStatus;
    }

    if (courierName && courierName !== order.courierDetails?.name) {
      updateFields['courierDetails.name'] = courierName;
    }

    if (courierPhone && courierPhone !== order.courierDetails?.phone) {
      updateFields['courierDetails.phone'] = courierPhone;
    }

    // Extract ETA
    const eta = borzoOrder.delivery_time_to || borzoOrder.required_finish_datetime || null;
    if (eta) updateFields.estimatedDelivery = new Date(eta * 1000);

    if (Object.keys(updateFields).length > 0) {
      await Order.findByIdAndUpdate(order._id, updateFields);
    }

    if (mappedStatus) {
      const location = borzoOrder.points?.[1]?.address || '';
      await addDeliveryHistory(
        order._id,
        mappedStatus,
        location,
        `Borzo event: ${eventType} → ${status}`
      );
    }

    logger.info(`[Borzo Webhook] Processed order ${order._id}: event=${eventType}, status=${mappedStatus}`);
    return await Order.findById(order._id).lean();
  } catch (err) {
    logger.error(`[Borzo Webhook] Error processing payload: ${err.message}`);
    throw err;
  }
}

// ─── Public assignDelivery entry point ───────────────────────────────────────

const assignBorzoDelivery = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return null;

    if (!env.BORZO_API_KEY) {
      const errorMsg = 'BORZO_API_KEY is not configured';
      logger.error(`[Borzo] ${errorMsg}`);
      await Order.findByIdAndUpdate(orderId, {
        deliveryStatus: 'not_assigned',
        deliveryError: errorMsg,
      });
      throw new Error(errorMsg);
    }

    const result = await createBorzoOrder(order);
    return { status: 'order_confirmed', borzoOrderId: result?.order?.order_id };
  } catch (err) {
    logger.error(`[Borzo] Assign delivery failed for ${orderId}: ${err.message}`);
    const errorMsg = `Borzo delivery assignment failed: ${err.message}`;
    await Order.findByIdAndUpdate(orderId, {
      deliveryStatus: 'not_assigned',
      deliveryError: errorMsg,
    });
    return { error: errorMsg, status: 'not_assigned' };
  }
};

const trackBorzoDelivery = async (orderId) => {
  const order = await Order.findById(orderId).lean();
  if (!order) return null;
  return trackBorzoOrder(order);
};

module.exports = {
  assignBorzoDelivery,
  trackBorzoDelivery,
  handleBorzoWebhook,
  calculateOrder,
  getCourierLocation,
  BORZO_STATUS_MAP,
};
