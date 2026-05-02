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
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paymentId: {
      type: String,
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['not_assigned', 'assigned', 'in_transit', 'delivered'],
      default: 'not_assigned',
    },
    deliveryTrackingId: {
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
