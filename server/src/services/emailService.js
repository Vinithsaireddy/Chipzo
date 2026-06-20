'use strict';

const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Low-level transactional email sending client powered by Resend API.
 * Automatically falls back to high-fidelity console logging in development if credentials are empty.
 */
async function sendEmail({ to, subject, html, attachments }) {
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.EMAIL_FROM;

  // Development/Simulation fallback if no real Resend credentials exist
  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('re_123456')) {
    logger.info('\n================== 📧 [CHIPZO EMAIL SIMULATOR] ==================');
    logger.info(`TO          : ${to}`);
    logger.info(`FROM        : Chipzo Support <${fromEmail}>`);
    logger.info(`SUBJECT     : ${subject}`);
    logger.info(`BODY LENGTH : ${html.length} chars`);
    if (attachments && attachments.length) {
      logger.info(`ATTACHMENTS : ${attachments.map((a) => `${a.filename} (${a.content.length} base64 chars)`).join(', ')}`);
    }
    logger.info('------------------- [HTML SNAPSHOT START] -------------------');
    // Extract readable portions (such as title, verification code, totals)
    const cleanBody = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    logger.info(cleanBody.slice(0, 400) + (cleanBody.length > 400 ? '...' : ''));
    logger.info('-------------------- [HTML SNAPSHOT END] --------------------');
    logger.info('=============================================================\n');
    return { success: true, simulated: true };
  }

  try {
    const payload = {
      from: `Chipzo Support <${fromEmail}>`,
      to: [to],
      subject,
      html,
    };

    if (attachments && attachments.length) {
      payload.attachments = attachments;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Resend returned HTTP ${response.status}`);
    }

    logger.info(`[Email Dispatch] Successfully sent transactional mail to ${to} (ID: ${data.id})`);
    return { success: true, messageId: data.id };
  } catch (error) {
    logger.error(`[Email Error] Failed to send email to ${to}: ${error.message}`);
    // If in development mode, fail gracefully so local auth or checkout flows don't crash
    if (env.NODE_ENV === 'development') {
      logger.warn('\n================== ⚠️ [CHIPZO EMAIL BACKUP LOG] ==================');
      logger.warn(`TO      : ${to}`);
      logger.warn(`SUBJECT : ${subject}`);
      logger.warn(`ERROR   : ${error.message}`);
      logger.warn('------------------ [CLEAN TEXT SUMMARY] ------------------');
      const cleanBody = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      logger.warn(cleanBody.slice(0, 400) + (cleanBody.length > 400 ? '...' : ''));
      logger.warn('==========================================================\n');
      logger.warn('[Email Warning] Suppressed email crash in development mode. Check console/logs.');
      return { success: false, error: error.message, simulated: true };
    }
    throw error;
  }
}

// ─── Email Template Builders ──────────────────────────────────────────────────

/**
 * Dispatches Welcome + Registration email
 */
async function sendWelcomeEmail(email, name) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Chipzo</title>
  <style>
    body {
      background-color: #f4f4f5;
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
      padding: 0;
      color: #18181b;
    }
    .wrapper {
      padding: 30px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 3px solid #18181b;
      box-shadow: 8px 8px 0px 0px #18181b;
      padding: 40px 30px;
    }
    .logo-accent {
      background-color: #18181b;
      color: #a3e635;
      display: inline-block;
      font-weight: 900;
      font-size: 24px;
      padding: 5px 15px;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
    h1 {
      font-family: Arial, sans-serif;
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 0 0 10px 0;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .badge {
      display: inline-block;
      background-color: #d9f99d;
      color: #3f6212;
      font-size: 12px;
      font-weight: bold;
      padding: 6px 12px;
      border: 2px solid #18181b;
      margin: 20px 0;
      text-transform: uppercase;
    }
    .footer {
      border-top: 2px dashed #e4e4e7;
      padding-top: 25px;
      margin-top: 30px;
      font-size: 11px;
      color: #71717a;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-accent">CHIPZO</div>
      <h1>MAKER INITIALIZATION COMPLETE</h1>
      
      <div class="badge">🌐 Node Status: Operational</div>

      <p>Hello <strong>${name.toUpperCase()}</strong>,</p>
      <p>Welcome to the Chipzo Maker Network. Your maker profile has been initialized successfully, and your account node is fully active in our global registry.</p>
      <p>You now have priority access to our supply chain hub housing 217+ verified electronic components, ready for instant dispatch to fuel your engineering ideas and projects.</p>

      <p>Log in at any time to manage your delivery nodes, track transits, or audit checkout telemetries in real-time.</p>

      <p>Keep building,</p>
      <p><strong>The Chipzo Team</strong></p>

      <div class="footer">
        ■ CHIPZO ELECTRONICS CORP ■<br>
        Bengaluru Hardware Logistics Hub<br>
        This is an automated system dispatch. Do not reply.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `[CHIPZO] Welcome to the Maker Network, ${name.toUpperCase()}!`,
    html,
  });
}

/**
 * Dispatches Order Confirmation email with attached PDF invoice
 */
async function sendOrderConfirmation(email, name, order, invoiceBuffer) {
  const itemsList = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; border-bottom: 1px dotted #e4e4e7;">${item.name}</td>
      <td style="padding: 10px 0; font-size: 13px; text-align: center; border-bottom: 1px dotted #e4e4e7;">${item.quantity}</td>
      <td style="padding: 10px 0; font-size: 13px; text-align: right; font-weight: bold; border-bottom: 1px dotted #e4e4e7;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const calculateDeliveryFee = (cartTotal) => {
    if (cartTotal > 1000) return 49;
    if (cartTotal >= 250) return 79;
    return 99;
  };
  const shipping = calculateDeliveryFee(order.totalAmount);
  const total = order.totalAmount + shipping;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed</title>
  <style>
    body {
      background-color: #f4f4f5;
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
      padding: 0;
      color: #18181b;
    }
    .wrapper {
      padding: 30px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 3px solid #18181b;
      box-shadow: 8px 8px 0px 0px #18181b;
      padding: 40px 30px;
    }
    .logo-accent {
      background-color: #18181b;
      color: #a3e635;
      display: inline-block;
      font-weight: 900;
      font-size: 24px;
      padding: 5px 15px;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
    h1 {
      font-family: Arial, sans-serif;
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 0 0 10px 0;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .totals-box {
      background-color: #18181b;
      color: #a3e635;
      padding: 15px;
      margin: 25px 0;
      font-weight: bold;
      text-align: right;
    }
    .shipping-box {
      border: 2px solid #18181b;
      padding: 20px;
      margin: 25px 0;
      background-color: #fcfdf9;
    }
    .footer {
      border-top: 2px dashed #e4e4e7;
      padding-top: 25px;
      margin-top: 30px;
      font-size: 11px;
      color: #71717a;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-accent">CHIPZO</div>
      <h1>ORDER DEPLOYED SUCCESSFULLY</h1>
      <p>Hello <strong>${name.toUpperCase()}</strong>,</p>
      <p>Your hardware procurement transaction has been approved. The components have been checked out from the main electronics supply chain and are scheduled for transit packaging.</p>

      <div style="font-size: 12px; color: #71717a; margin-bottom: 10px;">ORDER METADATA:</div>
      <div style="background-color: #f4f4f5; padding: 12px; font-weight: bold; border-left: 4px solid #18181b;">
        ID: ${order._id.toString().toUpperCase()}<br>
        GATEWAY: ${order.paymentMethod.toUpperCase()}<br>
        EST. PACKAGING: 24 - 48 Hours
      </div>

      <table class="details-table">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 10px; font-size: 11px; color: #71717a; text-transform: uppercase;">Component Description</th>
            <th style="text-align: center; padding-bottom: 10px; font-size: 11px; color: #71717a; text-transform: uppercase;">Qty</th>
            <th style="text-align: right; padding-bottom: 10px; font-size: 11px; color: #71717a; text-transform: uppercase;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>

      <div style="text-align: right; font-size: 13px;">
        Subtotal: ₹${order.totalAmount.toFixed(2)}<br>
        Shipping: ₹${shipping.toFixed(2)}
      </div>

      <div class="totals-box">
        TOTAL PROCURED VALUE: ₹${total.toFixed(2)}
      </div>

      <div class="shipping-box">
        <div style="font-size: 11px; font-weight: bold; color: #71717a; margin-bottom: 8px; text-transform: uppercase;">SHIPPING TARGET COORDINATES:</div>
        <strong>${(order.address.fullName || '').toUpperCase()}</strong><br>
        ${(order.address.house ? order.address.house + ', ' : '')}${(order.address.street || '')}<br>
        ${(order.address.city || '')}, ${(order.address.state || '')} - ${(order.address.pincode || '')}
      </div>

      <p>📎 <strong>Your official receipt and tax invoice is attached to this transmission as a high-fidelity PDF.</strong> You can retain this file for your billing ledger records.</p>

      <div class="footer">
        ■ CHIPZO ELECTRONICS CORP ■<br>
        Bengaluru Hardware Logistics Hub<br>
        This is an automated system dispatch. Do not reply.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const base64Invoice = invoiceBuffer.toString('base64');

  return sendEmail({
    to: email,
    subject: `[CHIPZO] Order Confirmed - Ref: #${order._id.toString().slice(-8).toUpperCase()}`,
    html,
    attachments: [
      {
        content: base64Invoice,
        filename: `invoice_${order._id.toString().slice(-8).toUpperCase()}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });
}

/**
 * Dispatches Delivery Confirmation email
 */
async function sendDeliveryConfirmation(email, name, order) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
  <style>
    body {
      background-color: #f4f4f5;
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
      padding: 0;
      color: #18181b;
    }
    .wrapper {
      padding: 30px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 3px solid #18181b;
      box-shadow: 8px 8px 0px 0px #18181b;
      padding: 40px 30px;
    }
    .logo-accent {
      background-color: #18181b;
      color: #a3e635;
      display: inline-block;
      font-weight: 900;
      font-size: 24px;
      padding: 5px 15px;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
    h1 {
      font-family: Arial, sans-serif;
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 0 0 10px 0;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .badge {
      display: inline-block;
      background-color: #d9f99d;
      color: #3f6212;
      font-size: 12px;
      font-weight: bold;
      padding: 6px 12px;
      border: 2px solid #18181b;
      margin: 20px 0;
      text-transform: uppercase;
    }
    .footer {
      border-top: 2px dashed #e4e4e7;
      padding-top: 25px;
      margin-top: 30px;
      font-size: 11px;
      color: #71717a;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-accent">CHIPZO</div>
      <h1>DELIVERY TRANSACTION FULFILLED</h1>
      
      <div class="badge">🚀 Signal Delivered: FULFILLED</div>

      <p>Hello <strong>${name.toUpperCase()}</strong>,</p>
      <p>Our telemetry indicates that your cargo package has successfully arrived at its target coordinates. Your order has been delivered and checked in by the recipient node.</p>

      <div style="font-size: 12px; color: #71717a; margin-bottom: 10px;">FULFILLMENT METADATA:</div>
      <div style="background-color: #f4f4f5; padding: 12px; font-weight: bold; border-left: 4px solid #18181b; margin-bottom: 20px;">
        ORDER ID: ${order._id.toString().toUpperCase()}<br>
        SHIPMENT TRACKING: ${order.deliveryTrackingId || 'N/A'}<br>
        DELIVERED TIME: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST
      </div>

      <p>We hope the components fuel your engineering ideas and projects! Should you encounter any parameter malfunctions, do not hesitate to contact our core support hub.</p>
      <p>Keep building,</p>
      <p><strong>The Chipzo Team</strong></p>

      <div class="footer">
        ■ CHIPZO ELECTRONICS CORP ■<br>
        Bengaluru Hardware Logistics Hub<br>
        This is an automated system dispatch. Do not reply.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `[CHIPZO] Shipment Delivered - Ref: #${order._id.toString().slice(-8).toUpperCase()}`,
    html,
  });
}

/**
 * Dispatches Password Reset OTP email
 */
async function sendPasswordResetOTP(email, name, otp) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
  <style>
    body {
      background-color: #f4f4f5;
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
      padding: 0;
      color: #18181b;
    }
    .wrapper {
      padding: 30px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 3px solid #18181b;
      box-shadow: 8px 8px 0px 0px #18181b;
      padding: 40px 30px;
    }
    .logo-accent {
      background-color: #18181b;
      color: #a3e635;
      display: inline-block;
      font-weight: 900;
      font-size: 24px;
      padding: 5px 15px;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
    h1 {
      font-family: Arial, sans-serif;
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 0 0 10px 0;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .otp-box {
      background-color: #18181b;
      color: #a3e635;
      font-size: 36px;
      font-weight: 900;
      letter-spacing: 8px;
      text-align: center;
      padding: 20px;
      margin: 25px 0;
      font-family: 'Courier New', Courier, monospace;
    }
    .warning {
      background-color: #fef9c3;
      border: 2px solid #18181b;
      padding: 15px;
      margin: 20px 0;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .footer {
      border-top: 2px dashed #e4e4e7;
      padding-top: 25px;
      margin-top: 30px;
      font-size: 11px;
      color: #71717a;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-accent">CHIPZO</div>
      <h1>PASSWORD RESET REQUEST</h1>
      <p>Hello <strong>${name.toUpperCase()}</strong>,</p>
      <p>A secure password reset request was received for your Chipzo account. Use the following one-time authorization code to proceed:</p>

      <div class="otp-box">${otp}</div>

      <p style="font-size: 12px; color: #71717a;">This code expires in <strong>10 minutes</strong>. Do not share this code with anyone.</p>

      <div class="warning">⚠ If you did not request this, please ignore this email. Your account remains secure.</div>

      <p>Keep building,</p>
      <p><strong>The Chipzo Team</strong></p>

      <div class="footer">
        ■ CHIPZO ELECTRONICS CORP ■<br>
        Bengaluru Hardware Logistics Hub<br>
        This is an automated system dispatch. Do not reply.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `[CHIPZO] Password Reset Code: ${otp}`,
    html,
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendDeliveryConfirmation,
  sendPasswordResetOTP,
};
