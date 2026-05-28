'use strict';

const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');

/**
 * Creates a new Order document after successful payment.
 *
 * @param {object} params
 * @param {string}   params.userId
 * @param {Array}    params.items          - Snapshot items with name, price, quantity
 * @param {number}   params.totalAmount
 * @param {object}   params.address
 * @param {string}   params.paymentId      - Razorpay payment ID
 * @param {string}   params.razorpayOrderId
 * @param {string}   params.paymentSignature - Razorpay signature
 * @returns {Promise<Order>}
 */
const createOrder = async ({
  userId,
  items,
  totalAmount,
  address,
  paymentId,
  razorpayOrderId,
  paymentSignature,
  paymentMethod = 'razorpay',
  paymentStatus = 'paid',
}) => {
  const order = await Order.create({
    userId,
    items,
    totalAmount,
    address,
    paymentMethod,
    paymentStatus,
    ...(paymentId ? { paymentId } : {}),
    ...(razorpayOrderId ? { razorpayOrderId } : {}),
    ...(paymentSignature ? { paymentSignature } : {}),
  });

  return order;
};

/**
 * Returns all orders for a user, newest first, paginated.
 *
 * @param {string} userId
 * @param {number} page
 * @param {number} limit
 */
const getUserOrders = async (userId, page = 1, limit = 10) => {
  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.min(parseInt(limit, 10), 50);
  const skip = (pageNum - 1) * limitNum;

  const [orders, totalCount] = await Promise.all([
    Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Order.countDocuments({ userId }),
  ]);

  return {
    orders,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
    currentPage: pageNum,
    limit: limitNum,
  };
};

/**
 * Fetches a single order that belongs to the given user.
 * @param {string} orderId
 * @param {string} userId
 */
const getOrderById = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId }).lean();
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return order;
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
};
