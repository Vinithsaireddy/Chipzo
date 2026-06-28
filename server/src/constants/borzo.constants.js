'use strict';

/**
 * Borzo (formerly Mr.Speedy / Wefast) delivery status mapping.
 * Maps Borzo's status strings to Chipzo's internal delivery statuses.
 */

const BORZO_STATUS_MAP = {
  // Order hasn't been picked up by a courier yet
  planned: 'order_confirmed',
  // Courier has been assigned but hasn't started yet
  courier_assigned: 'bike_booked',
  // Courier has departed to the pickup location
  courier_departed: 'pickup_started',
  // Courier has arrived at the pickup location
  courier_at_pickup: 'pickup_started',
  // Parcel has been collected by the courier
  parcel_picked_up: 'in_transit',
  // Courier is actively delivering
  active: 'in_transit',
  // Courier has arrived at the drop-off location
  courier_arrived: 'out_for_delivery',
  // Order delivered successfully
  finished: 'delivered',
  // Delivery was delayed
  delayed: 'in_transit',
  // Return delivery statuses
  return_arrived_to_warehouse: 'failed_delivery',
  return_in_progress: 'failed_delivery',
  return_delivered: 'failed_delivery',
  return_rejected: 'failed_delivery',
  // Re-attempt statuses
  reattempt_assigned: 'out_for_delivery',
  reattempt_in_progress: 'out_for_delivery',
};

/**
 * Borzo vehicle type IDs.
 * 7 = bicycle, 8 = motorbike (default), 9 = car, 10 = truck
 */
const BORZO_VEHICLE_TYPE = {
  BICYCLE: 7,
  MOTORBIKE: 8,
  CAR: 9,
  TRUCK: 10,
};

/**
 * Borzo order types.
 */
const BORZO_ORDER_TYPES = {
  STANDARD: 'standard',
  END_OF_DAY: 'endofday',
  VIP: 'vip_delivery',
};

module.exports = {
  BORZO_STATUS_MAP,
  BORZO_VEHICLE_TYPE,
  BORZO_ORDER_TYPES,
};
