'use strict';

const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { protect } = require('../middleware/auth.middleware');

/** GET /api/delivery/provider — Public: returns active delivery provider info */
router.get('/provider', deliveryController.getDeliveryProvider);

// All remaining delivery routes are protected
router.use(protect);

/** GET /api/delivery/track/:orderId — Get tracking status for an order */
router.get('/track/:orderId', deliveryController.trackDelivery);

module.exports = router;
