'use strict';

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./src/models/Product');
const connectDB = require('./src/config/db');

const CATEGORY_IMAGES = {
  'Battery': [
    'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=500&auto=format&fit=crop&q=80',
  ],
  'Battery Holder': [
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
  ],
  'Wire': [
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80',
  ],
  'Microcontroller': [
    'https://images.unsplash.com/photo-1608564697071-ddf911d81370?w=500&auto=format&fit=crop&q=80',
  ],
  'Communication': [
    'https://images.unsplash.com/photo-1562408590-e32931084e23?w=500&auto=format&fit=crop&q=80',
  ],
  'Sensor': [
    'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&auto=format&fit=crop&q=80',
  ],
  'Display': [
    'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=500&auto=format&fit=crop&q=80',
  ],
  'Motor': [
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=80',
  ],
  'Robotics': [
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=80',
  ],
  'Drone': [
    'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=500&auto=format&fit=crop&q=80',
  ],
  'Switch': [
    'https://images.unsplash.com/photo-1610569265279-c9502a63682c?w=500&auto=format&fit=crop&q=80',
  ],
  'Output': [
    'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500&auto=format&fit=crop&q=80',
  ],
  'Tool': [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=80',
  ],
  'Kit': [
    'https://images.unsplash.com/photo-1553406830-ef2513678893?w=500&auto=format&fit=crop&q=80',
  ],
  'Passive': [
    'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=500&auto=format&fit=crop&q=80',
  ],
  'IC': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
  ],
};

const getRealisticPrice = (category, name) => {
  const cat = category.toLowerCase();
  const lowerName = name.toLowerCase();

  if (cat.includes('microcontroller') || lowerName.includes('arduino') || lowerName.includes('esp32') || lowerName.includes('raspberry')) {
    if (lowerName.includes('raspberry pi 5')) return Math.floor(Math.random() * 2000) + 4500;
    if (lowerName.includes('mega 2560')) return Math.floor(Math.random() * 200) + 650;
    if (lowerName.includes('uno r3')) return Math.floor(Math.random() * 100) + 450;
    return Math.floor(Math.random() * 250) + 200; // e.g. esp32, nano
  }
  
  if (cat.includes('sensor')) {
    if (lowerName.includes('environmental') || lowerName.includes('bme280') || lowerName.includes('color')) {
      return Math.floor(Math.random() * 150) + 250;
    }
    return Math.floor(Math.random() * 80) + 50; // simple DHT11, MQ-2, PIR etc.
  }

  if (cat.includes('display') || lowerName.includes('oled') || lowerName.includes('lcd')) {
    if (lowerName.includes('nextion') || lowerName.includes('tft')) {
      return Math.floor(Math.random() * 600) + 750;
    }
    return Math.floor(Math.random() * 150) + 120;
  }

  if (cat.includes('motor') || cat.includes('driver')) {
    if (lowerName.includes('nema17') || lowerName.includes('stepper')) {
      return Math.floor(Math.random() * 250) + 400;
    }
    return Math.floor(Math.random() * 100) + 80;
  }

  if (cat.includes('battery')) {
    if (lowerName.includes('li-po') || lowerName.includes('lipo')) {
      if (lowerName.includes('3s') || lowerName.includes('11.1v')) return 1150;
      if (lowerName.includes('2s') || lowerName.includes('7.4v')) return 780;
      return Math.floor(Math.random() * 150) + 180;
    }
    if (lowerName.includes('18650') || lowerName.includes('li-ion')) return Math.floor(Math.random() * 80) + 120;
    return Math.floor(Math.random() * 30) + 20; // standard AA, AAA coin cells
  }

  if (cat.includes('tool') || lowerName.includes('multimeter') || lowerName.includes('soldering')) {
    if (lowerName.includes('soldering iron') || lowerName.includes('multimeter')) {
      return Math.floor(Math.random() * 500) + 350;
    }
    return Math.floor(Math.random() * 120) + 80;
  }

  if (cat.includes('kit') || lowerName.includes('starter')) {
    return Math.floor(Math.random() * 1000) + 899;
  }

  if (cat.includes('passive') || cat.includes('resistor') || cat.includes('capacitor')) {
    return Math.floor(Math.random() * 5) + 3; // Resistors are very cheap (e.g. ₹3-8)
  }

  if (cat.includes('semiconductor') || cat.includes('ic') || lowerName.includes('timer') || lowerName.includes('regulator')) {
    return Math.floor(Math.random() * 25) + 15;
  }

  if (cat.includes('wire') || lowerName.includes('jumper') || lowerName.includes('cable')) {
    return Math.floor(Math.random() * 60) + 40;
  }

  return Math.floor(Math.random() * 100) + 50; // generic default price
};

const seed = async () => {
  try {
    console.log('🌱  Starting database seeding process...');
    await connectDB();

    console.log('🧹  Cleaning existing products...');
    const deleteRes = await Product.deleteMany({});
    console.log(`🧹  Deleted ${deleteRes.deletedCount} products.`);

    console.log('📂  Reading chipzo_inventory.json...');
    const rawData = fs.readFileSync(path.join(__dirname, 'chipzo_inventory.json'), 'utf-8');
    const inventory = JSON.parse(rawData);

    if (!inventory.categories || !Array.isArray(inventory.categories)) {
      throw new Error('Invalid inventory JSON structure. "categories" array is missing.');
    }

    const productsToInsert = [];

    for (const categoryItem of inventory.categories) {
      const categoryName = categoryItem.name;
      const products = categoryItem.products || [];

      for (const prod of products) {
        let finalCategory = categoryName;

        const price = getRealisticPrice(finalCategory, prod.name);
        const stock = Math.floor(Math.random() * 140) + 15; // 15 to 155 units
        
        // Select matching image or default
        const imgList = CATEGORY_IMAGES[finalCategory] || CATEGORY_IMAGES['Battery'];
        const images = imgList;

        productsToInsert.push({
          id: prod.id,
          name: prod.name,
          category: finalCategory,
          description: prod.description || `High-quality ${prod.name} for electronics prototyping and professional integration.`,
          specifications: prod.specifications || {},
          interfaces: prod.interfaces || [],
          price: price,
          currency: 'INR',
          in_stock: stock > 0,
          stock: stock,
          images: images
        });
      }
    }

    console.log(`📦  Preparing to insert ${productsToInsert.length} products...`);
    const inserted = await Product.insertMany(productsToInsert);
    console.log(`✅  Successfully seeded ${inserted.length} products into the MongoDB database!`);

    mongoose.connection.close();
    console.log('🔌  Database connection closed gracefully.');
    process.exit(0);
  } catch (error) {
    console.error('❌  Seeding failed:', error);
    process.exit(1);
  }
};

seed();
