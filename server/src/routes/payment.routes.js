'use strict';

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

/** POST /api/payment/verify — Verify Razorpay signature and finalize order */
router.post('/verify', protect, paymentController.verifyPayment);

/** POST /api/payment/failure — Log failed payment attempt */
router.post('/failure', protect, paymentController.paymentFailure);

module.exports = router;
