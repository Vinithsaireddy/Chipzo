'use strict';

const https = require('https');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Formats order items into a clear text list for WhatsApp.
 * 
 * @param {Array} items - List of items in the order
 * @returns {string} - Formatted item list string
 */
const formatItemList = (items) => {
  return items
    .map((item, index) => `${index + 1}. *${item.name}* (Qty: ${item.quantity})`)
    .join('\n');
};

/**
 * Formats the full order notification message.
 * Only includes the buyer name, ordered items, and their quantities.
 * 
 * @param {object} order - The Order document
 * @returns {string} - The complete message string
 */
const formatOrderMessage = (order) => {
  const itemList = formatItemList(order.items);
  return `🛒 *NEW ORDER RECEIVED*

👤 *Buyer:* ${order.address.fullName}

📦 *Items:*
${itemList}`;
};

/**
 * Sends a message via Meta WhatsApp Cloud API using native Node https.
 * 
 * @param {string} text - Message body
 * @returns {Promise<object>}
 */
const sendMetaWhatsApp = (text) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: env.WHATSAPP_RECEIVER_NUMBER,
      type: 'text',
      text: {
        body: text,
      },
    });

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v20.0/${env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.META_WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Meta API error (${res.statusCode}): ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Meta response: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Dispatches the order notification to the hardcoded recipient number.
 * Supports both real Meta API integration and a local Mock provider.
 * 
 * @param {object} order - The Order document
 * @returns {Promise<boolean>}
 */
const sendOrderNotification = async (order) => {
  try {
    const message = formatOrderMessage(order);

    if (env.WHATSAPP_PROVIDER === 'mock') {
      logger.info(`[WhatsApp Mock] Notification to hardcoded number ${env.WHATSAPP_RECEIVER_NUMBER}:\n\n${message}\n`);
      return true;
    }

    if (env.WHATSAPP_PROVIDER === 'meta') {
      logger.info(`[WhatsApp] Dispatching order ${order._id} notification to ${env.WHATSAPP_RECEIVER_NUMBER} via Meta Cloud API...`);
      const response = await sendMetaWhatsApp(message);
      logger.info(`[WhatsApp] Message successfully sent! Meta message ID: ${response.messages?.[0]?.id || 'N/A'}`);
      return true;
    }

    logger.warn(`[WhatsApp] Unknown provider configured: ${env.WHATSAPP_PROVIDER}`);
    return false;
  } catch (error) {
    logger.error(`[WhatsApp] Failed to dispatch notification: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendOrderNotification,
  formatOrderMessage,
};
