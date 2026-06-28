'use strict';

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

module.exports = {
  DELIVERY_STATUSES,
  STATUS_LABELS,
  STATUS_ORDER,
};
