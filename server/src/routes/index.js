'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const deliveryRoutes = require('./delivery.routes');

/**
 * Root router — mounts all sub-routers under /api prefix.
 * Imported once in app.js as: app.use('/api', router)
 */
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);
router.use('/delivery', deliveryRoutes);

/**
 * Health check endpoint — useful for load balancers and uptime monitors.
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VoltEx API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

module.exports = router;
