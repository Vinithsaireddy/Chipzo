'use strict';

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

/**
 * POST /api/webhook/shiprocket
 * Receives real-time shipment updates from Shiprocket.
 * No auth required — Shiprocket signs requests, but for now it's open.
 * In production, validate the Shiprocket webhook signature.
 */
router.post('/shiprocket', webhookController.shiprocketWebhook);

module.exports = router;
