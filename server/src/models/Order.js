'use strict';

const mongoose = require('mongoose');

// ─── Subdocument: order item snapshot ────────────────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

// ─── Subdocument: shipping address snapshot ───────────────────────────────────
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

// ─── Subdocument: delivery history entry ──────────────────────────────────────
const deliveryHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Main Order schema ────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    address: {
      type: addressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      default: 'razorpay',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    paymentSignature: {
      type: String,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: [
        'not_assigned',
        'order_confirmed',
        'bike_booked',
        'pickup_started',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'failed_delivery',
      ],
      default: 'not_assigned',
    },
    deliveryTrackingId: {
      type: String,
      default: null,
    },
    shipmentId: {
      type: String,
      default: null,
    },
    courierDetails: {
      name: { type: String, default: null },
      phone: { type: String, default: null },
      vehicleType: { type: String, default: null },
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    deliveryHistory: {
      type: [deliveryHistorySchema],
      default: [],
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
