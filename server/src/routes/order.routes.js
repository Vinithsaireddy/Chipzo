'use strict';

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { createOrderSchema } = require('../validators/order.validator');

// All order routes are protected
router.use(protect);

/** POST /api/orders — Initiate order (creates Razorpay order, not DB order) */
router.post('/', validate(createOrderSchema), orderController.initiateOrder);

/** GET /api/orders — Get paginated order history */
router.get('/', orderController.getOrders);

/** GET /api/orders/:id — Get single order */
router.get('/:id', orderController.getOrder);

module.exports = router;
