'use strict';

/**
 * Migration script: convert full R2 image URLs in MongoDB to filenames only.
 *
 * Before: "https://pub-xxx.r2.dev/products/uuid.jpg"
 * After:  "uuid.jpg"
 *
 * Run: node server/scripts/migrateImages.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const CLOUDFLARE_PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL || process.env.R2_PUBLIC_URL || '';

const extractFilename = (image) => {
  if (!image || typeof image !== 'string') return null;
  if (!image.startsWith('http')) return image;
  try {
    const url = new URL(image);
    const pathname = url.pathname.replace(/\/+$/, '');
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
};

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({ images: { $exists: true, $not: { $size: 0 } } }).lean();
    console.log(`Found ${products.length} products with images`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const newImages = product.images
        .map(extractFilename)
        .filter(Boolean);

      if (newImages.length === 0 && product.images.length > 0) {
        console.warn(`  [SKIP]  ${product._id}: could not extract filenames from`, product.images);
        skippedCount++;
        continue;
      }

      if (JSON.stringify(newImages) === JSON.stringify(product.images)) {
        skippedCount++;
        continue;
      }

      await Product.updateOne({ _id: product._id }, { $set: { images: newImages } });
      console.log(`  [OK]    ${product._id}: ${product.images.length} → ${newImages.length} images`);
      updatedCount++;
    }

    console.log(`\nDone. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
