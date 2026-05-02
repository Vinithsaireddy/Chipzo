'use strict';

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
  },
  { _id: false } // No separate _id for sub-documents
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: totalPrice ──────────────────────────────────────────────────────
// Only meaningful when productId is populated. Computed in cart.service.js
// after explicit .populate() calls so we keep the model lean.
cartSchema.virtual('totalPrice').get(function () {
  if (!this.items || this.items.length === 0) return 0;

  return this.items.reduce((total, item) => {
    // Guard: product may not be populated
    if (item.productId && typeof item.productId === 'object' && item.productId.price) {
      return total + item.productId.price * item.quantity;
    }
    return total;
  }, 0);
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
