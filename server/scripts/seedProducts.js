'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const CATEGORY_MAP = {
  'Battery': 'Battery',
  'Battery Holder': 'Battery Holder',
  'Wire': 'Wire',
  'Microcontroller': 'Microcontroller',
  'Communication': 'Communication',
  'Sensor': 'Sensor',
  'Display': 'Display',
  'Motor': 'Motor',
  'Robotics': 'Robotics',
  'Drone': 'Drone',
  'Switch': 'Switch',
  'Output': 'Output',
  'Tool': 'Tool',
  'Kit': 'Kit',
  'Passive': 'Passive',
  'IC': 'IC',
};

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('products');

  const raw = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'chipzo_clean_products.json'), 'utf-8')
  );

  const products = raw.map((p) => ({
    id: p.id || null,
    name: p.name,
    category: CATEGORY_MAP[p.category] || 'Other',
    description: p.description || '',
    specifications: p.specifications || {},
    interfaces: p.interfaces || [],
    price: p.price ?? null,
    currency: p.currency || 'INR',
    in_stock: p.in_stock ?? true,
    stock: p.stock ?? 0,
    images: p.images || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Validate no unmapped categories
  const unmapped = raw.filter((p) => !CATEGORY_MAP[p.category]);
  if (unmapped.length) {
    console.warn('Unmapped categories:', [...new Set(unmapped.map((p) => p.category))]);
  }

  // Drop existing products collection if it has data
  const count = await collection.countDocuments();
  if (count > 0) {
    console.log(`Dropping existing collection (${count} documents)...`);
    await collection.drop();
  }

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const result = await collection.insertMany(batch, { ordered: false });
    inserted += result.insertedCount;
    console.log(`Inserted ${inserted}/${products.length}`);
  }

  // Create indexes
  await collection.createIndex({ name: 'text', description: 'text' });
  await collection.createIndex({ category: 1 });
  await collection.createIndex({ price: 1 });
  await collection.createIndex({ in_stock: 1 });

  console.log(`\nDone. ${inserted} products seeded into 'products' collection.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
