'use strict';

const Order = require('../models/Order');
const logger = require('../utils/logger');
const env = require('../config/env');
const {
  STATUS_LABELS,
  CANCELLABLE_STATUSES,
  SHIPROCKET_STATUS_MAP,
  PICKUP_LOCATION,
} = require('../constants/delivery.constants');

const SHIPROCKET_BASE = env.SHIPROCKET_BASE_URL;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

let _shiprocketToken = null;
let _tokenExpiry = null;

// ─── Shiprocket Authentication ──────────────────────────────────────────────

async function getAuthToken() {
  if (_shiprocketToken && _tokenExpiry && Date.now() < _tokenExpiry) {
    return _shiprocketToken;
  }

  if (env.SHIPROCKET_API_KEY) {
    _shiprocketToken = env.SHIPROCKET_API_KEY;
    _tokenExpiry = Date.now() + 86400000;
    return _shiprocketToken;
  }

  if (env.SHIPROCKET_EMAIL && env.SHIPROCKET_PASSWORD) {
    const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: env.SHIPROCKET_EMAIL,
        password: env.SHIPROCKET_PASSWORD,
      }),
    });

    if (!res.ok) {
      throw new Error(`Shiprocket auth failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    _shiprocketToken = data.token;
    _tokenExpiry = Date.now() + 86400000;
    return _shiprocketToken;
  }

  throw new Error('No Shiprocket credentials configured.');
}

// ─── Retry wrapper ──────────────────────────────────────────────────────────

async function withRetry(fn, context = 'API call') {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      logger.warn(`[Shiprocket] ${context} attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }
  throw lastError;
}

// ─── Shiprocket HTTP request wrapper ────────────────────────────────────────

async function shiprocketRequest(path, options = {}) {
  const token = await getAuthToken();
  const url = `${SHIPROCKET_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    logger.error(`[Shiprocket] API error ${res.status} for ${options.method || 'GET'} ${path}: ${text}`);
    throw new Error(`Shiprocket API error: ${res.status}`);
  }

  return res.json();
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

// ─── Register pickup location if not exists ─────────────────────────────────

async function ensurePickupLocation() {
  try {
    const existing = await shiprocketRequest('/settings/company/pickup');
    const locations = existing.data || existing.pickup_locations || [];
    const alreadyExists = locations.some(
      (loc) => loc.name && loc.name.toLowerCase().includes('bit mens hostel')
    );

    if (!alreadyExists) {
      logger.info('[Shiprocket] Registering pickup location: BIT MENS HOSTEL');
      const result = await shiprocketRequest('/settings/company/add/pickup', {
        method: 'POST',
        body: JSON.stringify({
          pickup_location: PICKUP_LOCATION.name,
          name: PICKUP_LOCATION.name,
          email: env.SHIPROCKET_EMAIL || '',
          phone: PICKUP_LOCATION.phone,
          address: PICKUP_LOCATION.address,
          address_2: '',
          city: PICKUP_LOCATION.city,
          state: PICKUP_LOCATION.state,
          country: PICKUP_LOCATION.country,
          pin_code: PICKUP_LOCATION.pincode,
        }),
      });
      logger.info(`[Shiprocket] Pickup location registered: ${JSON.stringify(result)}`);
      return result;
    }
    logger.info('[Shiprocket] Pickup location already exists');
    return existing;
  } catch (err) {
    logger.warn(`[Shiprocket] Pickup location setup skipped: ${err.message}`);
    return null;
  }
}

// ─── Create Shiprocket shipment order (dynamic from DB) ─────────────────────

async function createShiprocketOrder(order) {
  if (!order) return null;

  return withRetry(async () => {
    const items = order.items || [];
    const addr = order.address || {};

    const totalWeight = items.reduce((sum, item) => sum + (item.quantity || 1) * 0.25, 0.5);

    const payload = {
      order_id: order._id.toString(),
      order_date: new Date(order.createdAt).toISOString().split('T')[0],
      pickup_location: PICKUP_LOCATION.name,
      channel_id: '',
      comment: `Order #${order._id.toString().slice(-8)}`,
      billing_customer_name: addr.fullName || '',
      billing_last_name: '',
      billing_address: `${addr.house || ''} ${addr.street || ''}`.trim() || 'Address',
      billing_city: addr.city || '',
      billing_pincode: addr.pincode || '',
      billing_state: addr.state || '',
      billing_country: 'India',
      billing_email: '',
      billing_phone: addr.phone || '',
      shipping_is_billing: true,
      order_items: items.map((item, i) => ({
        name: item.name || 'Component',
        sku: item.productId ? item.productId.toString().slice(-8) : `SKU-${i}`,
        units: item.quantity || 1,
        selling_price: item.price || 0,
        discount: 0,
        tax: 0,
        hsn: 8542,
      })),
      payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      sub_total: order.totalAmount || 0,
      length: 10,
      breadth: 10,
      height: 10,
      weight: Math.max(0.5, totalWeight),
    };

    const data = await shiprocketRequest('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const shipmentId = data.shipment_id || data.order_id || null;
    if (shipmentId) {
      const fullResponse = JSON.stringify(data);
      await Order.findByIdAndUpdate(order._id, {
        shipmentId: String(shipmentId),
        deliveryStatus: 'order_confirmed',
      });
      await addDeliveryHistory(
        order._id,
        'order_confirmed',
        `${PICKUP_LOCATION.name}, ${PICKUP_LOCATION.city}`,
        `Shipment created in Shiprocket (ID: ${shipmentId})`
      );
      logger.info(`[Shiprocket] Order created dynamically: ${order._id}, shipmentId: ${shipmentId}`);
    }

    return data;
  }, 'createShipment');
}

// ─── Book courier (generate AWB) ────────────────────────────────────────────

async function bookCourier(order) {
  if (!order || !order.shipmentId) return null;

  return withRetry(async () => {
    const data = await shiprocketRequest('/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify({
        shipment_id: Number(order.shipmentId),
        is_return: 0,
      }),
    });

    const awb = data.awb || data.tracking_id || null;
    const courierName = data.courier_name || data.courier_company || null;
    const estimatedDelivery = data.estimated_delivery_days
      ? new Date(Date.now() + data.estimated_delivery_days * 86400000)
      : null;

    const updateFields = { deliveryStatus: 'bike_booked' };
    if (awb) updateFields.deliveryTrackingId = String(awb);
    if (courierName) updateFields['courierDetails.name'] = courierName;
    if (estimatedDelivery) updateFields.estimatedDelivery = estimatedDelivery;

    await Order.findByIdAndUpdate(order._id, updateFields);
    await addDeliveryHistory(
      order._id,
      'bike_booked',
      '',
      courierName ? `Courier assigned: ${courierName} (AWB: ${awb})` : 'Bike/courier booked successfully'
    );

    logger.info(`[Shiprocket] Courier booked: ${order._id}, AWB: ${awb}`);

    return data;
  }, 'bookCourier');
}

// ─── Track shipment ─────────────────────────────────────────────────────────

async function trackShipment(order) {
  if (!order) return null;

  if (order.deliveryStatus === 'cancelled' || order.deliveryStatus === 'failed_delivery') {
    return buildTrackingResponse(order);
  }

  if (order.shipmentId) {
    try {
      const data = await shiprocketRequest(`/courier/track?shipment_id=${order.shipmentId}`);

      const trackingData = data.tracking_data || data.data || {};
      const trackStatus = trackingData.shipment_status || trackingData.status || '';
      const currentStatus = SHIPROCKET_STATUS_MAP[trackStatus] || order.deliveryStatus;
      const eta = trackingData.etd || trackingData.estimated_delivery || null;
      const currentLocation = trackingData.current_location || trackingData.location || '';
      const courierName = trackingData.courier_name || order.courierDetails?.name || '';
      const courierPhone = trackingData.courier_phone || order.courierDetails?.phone || '';

      const updateFields = {};
      if (currentStatus !== order.deliveryStatus) updateFields.deliveryStatus = currentStatus;
      if (courierName && courierName !== order.courierDetails?.name) updateFields['courierDetails.name'] = courierName;
      if (courierPhone && courierPhone !== order.courierDetails?.phone) updateFields['courierDetails.phone'] = courierPhone;
      if (eta) updateFields.estimatedDelivery = eta;

      if (Object.keys(updateFields).length > 0) {
        await Order.findByIdAndUpdate(order._id, updateFields);
      }

      if (currentStatus !== order.deliveryStatus) {
        await addDeliveryHistory(order._id, currentStatus, currentLocation, trackingData.shipment_status || '');
      }

      if (trackingData.scans && Array.isArray(trackingData.scans)) {
        for (const scan of trackingData.scans) {
          const scanStatus = SHIPROCKET_STATUS_MAP[scan.status] || scan.status || '';
          await addDeliveryHistory(order._id, scanStatus, scan.location || '', scan.activity || '');
        }
      }

      return buildTrackingResponse(order);
    } catch (err) {
      logger.warn(`[Shiprocket] Track failed for ${order._id}, returning DB state: ${err.message}`);
      return buildTrackingResponse(order);
    }
  }

  return buildTrackingResponse(order);
}

// ─── Cancel shipment with refund handling ───────────────────────────────────

async function cancelShipment(order) {
  if (!order || !order.shipmentId) {
    const updates = {
      deliveryStatus: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: 'Cancelled by user',
    };
    if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') {
      updates.paymentStatus = 'refunded';
    }
    await Order.findByIdAndUpdate(order._id, updates);
    await addDeliveryHistory(order._id, 'cancelled', '', 'Order cancelled by user');
    return { success: true, message: 'Order cancelled', refundInitiated: updates.paymentStatus === 'refunded' };
  }

  try {
    const data = await withRetry(async () => {
      return shiprocketRequest('/orders/cancel', {
        method: 'POST',
        body: JSON.stringify({ ids: [Number(order.shipmentId)] }),
      });
    }, 'cancelShipment');

    const updates = {
      deliveryStatus: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: 'Cancelled by user',
    };
    if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') {
      updates.paymentStatus = 'refunded';
    }
    await Order.findByIdAndUpdate(order._id, updates);
    await addDeliveryHistory(order._id, 'cancelled', '', 'Shipment cancelled via Shiprocket API');

    logger.info(`[Shiprocket] Shipment cancelled: ${order._id}, shipmentId: ${order.shipmentId}`);
    return { ...data, refundInitiated: updates.paymentStatus === 'refunded' };
  } catch (err) {
    logger.error(`[Shiprocket] Cancel failed for ${order._id}, cancelling locally: ${err.message}`);
    const updates = {
      deliveryStatus: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: 'Cancelled by user (Shiprocket error)',
    };
    if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') {
      updates.paymentStatus = 'refunded';
    }
    await Order.findByIdAndUpdate(order._id, updates);
    return { success: true, message: 'Order cancelled locally', refundInitiated: updates.paymentStatus === 'refunded' };
  }
}

// ─── Build tracking response ─────────────────────────────────────────────────

function buildTrackingResponse(order) {
  const history = (order.deliveryHistory || []).sort(
    (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)
  );

  return {
    orderId: order._id,
    deliveryStatus: order.deliveryStatus,
    statusLabel: STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus,
    trackingId: order.deliveryTrackingId,
    shipmentId: order.shipmentId,
    courierDetails: order.courierDetails || {},
    estimatedDelivery: order.estimatedDelivery,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    canCancel: CANCELLABLE_STATUSES.includes(order.deliveryStatus),
    history: history.map((h) => ({
      status: h.status,
      statusLabel: STATUS_LABELS[h.status] || h.status,
      location: h.location,
      description: h.description,
      updatedAt: h.updatedAt,
    })),
    isMocked: !order.shipmentId,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

const assignDelivery = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return null;

    const hasShiprocketCreds = env.SHIPROCKET_API_KEY || (env.SHIPROCKET_EMAIL && env.SHIPROCKET_PASSWORD);

    if (hasShiprocketCreds) {
      await ensurePickupLocation();
      const shipmentResult = await createShiprocketOrder(order);
      if (shipmentResult && shipmentResult.shipment_id) {
        const refreshedOrder = await Order.findById(orderId);
        await bookCourier(refreshedOrder);
      }
    } else {
      await assignMockDelivery(order);
    }

    return { trackingId: order.deliveryTrackingId, status: order.deliveryStatus };
  } catch (err) {
    logger.error(`[Delivery] Assign delivery failed for ${orderId}: ${err.message}`);
    return assignMockFallback(orderId);
  }
};

const trackDelivery = async (orderId) => {
  const order = await Order.findById(orderId).lean();
  if (!order) return null;
  return trackShipment(order);
};

const cancelDelivery = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.deliveryStatus === 'delivered') throw new Error('Cannot cancel a delivered order');
  if (order.deliveryStatus === 'cancelled') throw new Error('Order is already cancelled');
  if (!CANCELLABLE_STATUSES.includes(order.deliveryStatus)) {
    throw new Error(`Cannot cancel order in status: ${STATUS_LABELS[order.deliveryStatus] || order.deliveryStatus}`);
  }
  return cancelShipment(order);
};

// ─── Webhook handler ────────────────────────────────────────────────────────

const handleWebhook = async (payload) => {
  try {
    const shipmentId = payload.shipment_id || payload.order_id || null;
    const awb = payload.awb || payload.tracking_id || null;
    const status = payload.status || payload.current_status || '';
    const currentStatus = SHIPROCKET_STATUS_MAP[status] || '';
    const location = payload.current_location || '';
    const description = payload.activity || payload.remarks || '';
    const eta = payload.etd || payload.estimated_delivery || null;

    if (!shipmentId && !awb) {
      logger.warn('[Webhook] No shipment_id or awb in payload');
      return;
    }

    const query = shipmentId ? { shipmentId: String(shipmentId) } : { deliveryTrackingId: awb };
    const order = await Order.findOne(query);

    if (!order) {
      logger.warn(`[Webhook] No order found for shipmentId: ${shipmentId}, awb: ${awb}`);
      return;
    }

    const updateFields = {};
    if (currentStatus && currentStatus !== order.deliveryStatus) {
      updateFields.deliveryStatus = currentStatus;
    }
    if (awb && !order.deliveryTrackingId) {
      updateFields.deliveryTrackingId = String(awb);
    }
    if (eta) updateFields.estimatedDelivery = eta;

    if (Object.keys(updateFields).length > 0) {
      await Order.findByIdAndUpdate(order._id, updateFields);
    }

    if (currentStatus) {
      await addDeliveryHistory(order._id, currentStatus, location, description || `Status updated to ${currentStatus}`);
    }

    logger.info(`[Webhook] Processed for order ${order._id}: status=${currentStatus}`);
    return order;
  } catch (err) {
    logger.error(`[Webhook] Error processing payload: ${err.message}`);
    throw err;
  }
};

// ─── Mock implementations ───────────────────────────────────────────────────

const assignMockDelivery = async (order) => {
  const { v4: uuidv4 } = require('uuid');
  const trackingId = `VOLTEX-${uuidv4().slice(0, 8).toUpperCase()}`;
  logger.info(`[Delivery] Mock assigned: orderId=${order._id}, trackingId=${trackingId}`);

  const now = new Date();
  await Order.findByIdAndUpdate(order._id, {
    deliveryStatus: 'order_confirmed',
    deliveryTrackingId: trackingId,
    estimatedDelivery: new Date(now.getTime() + 90 * 60000),
  });
  await addDeliveryHistory(order._id, 'order_confirmed', 'Dispatch Center', 'Order confirmed and queued');

  return { trackingId, status: 'order_confirmed' };
};

const assignMockFallback = async (orderId) => {
  const { v4: uuidv4 } = require('uuid');
  const trackingId = `VOLTEX-${uuidv4().slice(0, 8).toUpperCase()}`;

  await Order.findByIdAndUpdate(orderId, {
    deliveryStatus: 'order_confirmed',
    deliveryTrackingId: trackingId,
  });

  return { trackingId, status: 'order_confirmed' };
};

module.exports = {
  assignDelivery,
  trackDelivery,
  cancelDelivery,
  handleWebhook,
  getAuthToken,
  ensurePickupLocation,
  STATUS_LABELS,
  CANCELLABLE_STATUSES,
};
