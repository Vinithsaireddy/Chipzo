'use strict';

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validate } = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { createOrderSchema } = require('../validators/order.validator');

// All order routes are protected
router.use(protect);

// Admin route guard
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
};

/** GET /api/orders/admin — Fetch all orders from all users (Admin only) */
router.get('/admin', adminOnly, orderController.getAllOrdersAdmin);

/** GET /api/orders/admin/:id — Fetch complete details of a single order (Admin only) */
router.get('/admin/:id', adminOnly, orderController.getOrderAdmin);

/** PUT /api/orders/admin/:id — Update order payment / delivery status (Admin only) */
router.put('/admin/:id', adminOnly, orderController.updateOrderAdmin);

/** DELETE /api/orders/admin/:id — Delete/cancel order (Admin only) */
router.delete('/admin/:id', adminOnly, orderController.deleteOrderAdmin);

/** POST /api/orders — Initiate order (creates Razorpay order, not DB order) */
router.post('/', validate(createOrderSchema), orderController.initiateOrder);

/** POST /api/orders/cod — Create COD order directly */
router.post('/cod', validate(createOrderSchema), orderController.createCODOrder);

/** GET /api/orders — Get paginated order history */
router.get('/', orderController.getOrders);

/** GET /api/orders/:id — Get single order */
router.get('/:id', orderController.getOrder);

module.exports = router;
