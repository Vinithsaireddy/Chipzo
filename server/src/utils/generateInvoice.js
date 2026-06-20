'use strict';

const PDFDocument = require('pdfkit');

/**
 * Generates a highly polished, professional, and visually matching neo-brutalist PDF invoice
 * purely in-memory, returning it as a Buffer.
 *
 * @param {Object} order - The populated Mongoose Order object
 * @returns {Promise<Buffer>} - Resolves to the PDF buffer
 */
function generateInvoicePdf(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // ─── Header & Branding ──────────────────────────────────────────────────────────
      // Outer border box (Neo-brutalist frame)
      doc
        .lineWidth(3)
        .rect(30, 30, 535, 782)
        .strokeColor('#111111')
        .stroke();

      // Company Title & Logo Accent
      doc
        .fillColor('#111111')
        .font('Helvetica-Bold')
        .fontSize(28)
        .text('CHIPZO', 50, 60);

      doc
        .fontSize(8)
        .font('Courier-Bold')
        .fillColor('#A3E635') // Chipzo Lime accent block
        .rect(170, 63, 100, 16)
        .fill()
        .fillColor('#111111')
        .text('SYS_ACTIVE_INVOICE', 175, 68);

      doc
        .fillColor('#111111')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('ELECTRONICS FOR MAKERS', 50, 95);

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#666666')
        .text('Chipzo Electronics Corp.', 50, 110)
        .text('Bengaluru Logistics Hub', 50, 122)
        .text('support@shopchipzo.com', 50, 134);

      // Meta Invoice Details (Right Side)
      doc
        .fillColor('#111111')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('INVOICE META LOGS', 380, 60, { align: 'right' });

      doc
        .font('Courier')
        .fontSize(9)
        .fillColor('#111111')
        .text(`ORDER ID : ${order._id.toString().toUpperCase()}`, 250, 78, { align: 'right', width: 295 })
        .text(`DATE     : ${new Date(order.createdAt).toLocaleDateString('en-US')}`, 250, 92, { align: 'right', width: 295 })
        .text(`PAY MODE : ${order.paymentMethod.toUpperCase()}`, 250, 106, { align: 'right', width: 295 })
        .text(`STATUS   : ${order.paymentStatus.toUpperCase()}`, 250, 120, { align: 'right', width: 295 });

      // Bold Divider Line
      doc
        .lineWidth(2)
        .moveTo(50, 160)
        .lineTo(545, 160)
        .strokeColor('#111111')
        .stroke();

      // ─── Customer Address Block ───────────────────────────────────────────────────
      doc
        .fillColor('#111111')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('DELIVERY DESTINATION coordinates', 50, 180);

      const addr = order.address || {};
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#333333')
        .text(`Recipient : ${addr.fullName || 'N/A'}`, 50, 200)
        .text(`Contact   : ${addr.phone || 'N/A'}`, 50, 215)
        .text(`Address   : ${addr.house ? addr.house + ', ' : ''}${addr.street || ''}`, 50, 230)
        .text(`City/State: ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}`, 50, 245);

      if (addr.landmark) {
        doc.text(`Landmark  : ${addr.landmark}`, 50, 260);
      }

      // Bold Divider Line
      doc
        .lineWidth(2)
        .moveTo(50, 285)
        .lineTo(545, 285)
        .strokeColor('#111111')
        .stroke();

      // ─── Table Header ─────────────────────────────────────────────────────────────
      doc
        .fillColor('#111111')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('BILL OF MATERIALS (BOM)', 50, 305);

      // Table Header Row Background
      doc
        .fillColor('#f3f4f6')
        .rect(50, 325, 495, 20)
        .fill();

      doc
        .fillColor('#111111')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('ITEM DESCRIPTION', 60, 331)
        .text('UNIT PRICE', 320, 331, { width: 70, align: 'right' })
        .text('QTY', 400, 331, { width: 40, align: 'center' })
        .text('TOTAL (INR)', 450, 331, { width: 85, align: 'right' });

      // Table Header Underline
      doc
        .lineWidth(1)
        .moveTo(50, 345)
        .lineTo(545, 345)
        .strokeColor('#111111')
        .stroke();

      // ─── Table Body ───────────────────────────────────────────────────────────────
      let y = 355;
      const items = order.items || [];

      doc.font('Helvetica').fontSize(9);

      items.forEach((item, index) => {
        // Strip out exceedingly long product names
        const name = item.name.length > 40 ? item.name.slice(0, 37) + '...' : item.name;
        const itemTotal = item.price * item.quantity;

        doc
          .fillColor('#111111')
          .text(name.toUpperCase(), 60, y)
          .text(`₹${item.price.toFixed(2)}`, 320, y, { width: 70, align: 'right' })
          .text(item.quantity.toString(), 400, y, { width: 40, align: 'center' })
          .text(`₹${itemTotal.toFixed(2)}`, 450, y, { width: 85, align: 'right' });

        y += 20;

        // Draw dotted separator between items
        doc
          .lineWidth(0.5)
          .moveTo(50, y - 5)
          .lineTo(545, y - 5)
          .dash(4, { space: 2 })
          .strokeColor('#cccccc')
          .stroke()
          .undash();
      });

      y += 10;

      // ─── Invoice Totals ───────────────────────────────────────────────────────────
      const calculateDeliveryFee = (cartTotal) => {
        if (cartTotal > 1000) return 49;
        if (cartTotal >= 250) return 79;
        return 99;
      };
      const subtotal = order.totalAmount;
      const shipping = calculateDeliveryFee(subtotal);
      const grandTotal = subtotal + shipping;

      doc
        .font('Helvetica-Bold')
        .fillColor('#111111')
        .text('Subtotal:', 340, y, { width: 100, align: 'right' })
        .font('Helvetica')
        .text(`₹${subtotal.toFixed(2)}`, 450, y, { width: 85, align: 'right' });

      y += 18;

      doc
        .font('Helvetica-Bold')
        .text('Shipping & Handling:', 340, y, { width: 100, align: 'right' })
        .font('Helvetica')
        .text(`₹${shipping.toFixed(2)}`, 450, y, { width: 85, align: 'right' });

      y += 22;

      // Neo-brutalist Grand Total Highlight Card
      doc
        .fillColor('#111111')
        .rect(320, y - 6, 225, 26)
        .fill();

      doc
        .fillColor('#A3E635')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('TOTAL AMOUNT PAID:', 330, y)
        .text(`₹${grandTotal.toFixed(2)}`, 450, y, { width: 85, align: 'right' });

      // ─── Footer Terms ─────────────────────────────────────────────────────────────
      doc
        .fillColor('#666666')
        .font('Courier-Oblique')
        .fontSize(8)
        .text('Thank you for supporting open source hardware! All components listed are subject to maker quality testing standards. This document is a digitally compiled transaction report.', 50, 740, { width: 495, align: 'center' });

      doc
        .fillColor('#111111')
        .font('Courier-Bold')
        .fontSize(8)
        .text('■ CHIPZO SECURE TRANS NODE ■', 50, 770, { width: 495, align: 'center' });

      // Finalize and close the document stream
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateInvoicePdf;
