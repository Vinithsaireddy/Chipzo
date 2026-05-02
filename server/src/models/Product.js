'use strict';

const mongoose = require('mongoose');

const PRODUCT_CATEGORIES = [
  'resistors',
  'capacitors',
  'inductors',
  'semiconductors',
  'connectors',
  'switches',
  'modules',
  'tools',
  'other',
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    // Cloudflare R2 object key — used for deletion/replacement
    imageKey: {
      type: String,
      default: null,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    category: {
      type: String,
      enum: {
        values: PRODUCT_CATEGORIES,
        message: `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`,
      },
      required: [true, 'Category is required'],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Text search index ────────────────────────────────────────────────────────
productSchema.index({ name: 'text', description: 'text' });

// ─── Additional query indexes ─────────────────────────────────────────────────
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
module.exports.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
