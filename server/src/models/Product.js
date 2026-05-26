'use strict';

const mongoose = require('mongoose');

/**
 * Exact category names from chipzo_inventory.json.
 */
const PRODUCT_CATEGORIES = [
  'Battery',
  'Battery Holder',
  'Wire',
  'Microcontroller',
  'Sensor',
  'Display',
  'Motor & Driver',
  'Power Supply',
  'Relay & Switch',
  'Communication Module',
  'Prototyping',
  'Tool',
  'Passive Component',
  'Semiconductor',
  'LED & Lighting',
  'Other',
];

const productSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────────────────────────────
    /** Human-readable slug from inventory (e.g. "arduino_uno_r3") */
    id: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,       // allows null / missing without unique-conflict
    },

    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: PRODUCT_CATEGORIES,
        message: `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}`,
      },
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    // ── Technical details ───────────────────────────────────────────────────
    /** Flexible key-value pairs (voltage, chemistry, flash, etc.) */
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /** Supported protocols / interfaces (UART, I2C, SPI, …) */
    interfaces: {
      type: [String],
      default: [],
    },

    // ── Pricing ─────────────────────────────────────────────────────────────
    /** null = price not yet set / TBD */
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: null,
    },

    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },

    // ── Inventory ───────────────────────────────────────────────────────────
    in_stock: {
      type: Boolean,
      default: true,
    },

    /** Physical quantity on hand (optional, fine-grained tracking) */
    stock: {
      type: Number,
      integer: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },

    // ── Media ────────────────────────────────────────────────────────────────
    /** Array of image URLs (Cloudflare R2 public URLs or external links) */
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,   // adds createdAt / updatedAt
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ in_stock: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
module.exports.PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
