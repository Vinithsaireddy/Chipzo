'use strict';

const env = require('../config/env');

const DELIVERY_STATUSES = [
  'not_assigned',
  'order_confirmed',
  'bike_booked',
  'pickup_started',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'failed_delivery',
];

const STATUS_LABELS = {
  not_assigned: 'Not Assigned',
  order_confirmed: 'Order Confirmed',
  bike_booked: 'Bike Booked',
  pickup_started: 'Pickup Started',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed_delivery: 'Failed Delivery',
};

const STATUS_ORDER = [
  'order_confirmed',
  'bike_booked',
  'pickup_started',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

const CANCELLABLE_STATUSES = ['order_confirmed', 'bike_booked', 'pickup_started'];

const SHIPROCKET_STATUS_MAP = {
  'NEW': 'order_confirmed',
  'PICKUP': 'pickup_started',
  'IN_TRANSIT': 'in_transit',
  'OUT_FOR_DELIVERY': 'out_for_delivery',
  'DELIVERED': 'delivered',
  'CANCELLED': 'cancelled',
  'RTO': 'failed_delivery',
  'UNDELIVERED': 'failed_delivery',
};

const PICKUP_LOCATION = {
  name: env.SHIPROCKET_PICKUP_NAME,
  address: env.SHIPROCKET_PICKUP_ADDRESS,
  city: env.SHIPROCKET_PICKUP_CITY,
  state: env.SHIPROCKET_PICKUP_STATE,
  pincode: env.SHIPROCKET_PICKUP_PINCODE,
  phone: env.SHIPROCKET_PICKUP_PHONE,
  country: 'India',
};

module.exports = {
  DELIVERY_STATUSES,
  STATUS_LABELS,
  STATUS_ORDER,
  CANCELLABLE_STATUSES,
  SHIPROCKET_STATUS_MAP,
  PICKUP_LOCATION,
};
