'use strict';

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

/**
 * Verifies the Borzo webhook using a static secret token.
 * Borzo sends the token in the x-borzo-token header or as a query parameter.
 * Set BORZO_WEBHOOK_SECRET in your .env and configure the same value in the
 * Borzo dashboard under Integration → Callback URL (append ?token=<secret>).
 */
function verifyBorzoWebhook(req, res, next) {
  const token = req.headers['x-borzo-token'] || req.query.token;

  if (!token || token !== process.env.BORZO_WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
}

/**
 * POST /api/webhook/borzo
 * Receives real-time delivery updates from Borzo.
 * Token is verified before the payload is processed.
 * Configure your Callback URL in Borzo Business → Integration → Callback URL.
 * Set this to: https://yourdomain.com/api/webhook/borzo
 */
router.post('/borzo', verifyBorzoWebhook, webhookController.borzoWebhook);

module.exports = router;
