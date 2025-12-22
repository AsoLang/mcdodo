// Path: lib/email.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// --- SHARED TYPES ---
interface Address {
  line1: string | null;
  line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

// --- ORDER CONFIRMATION EMAIL ---
interface OrderConfirmationEmailProps {
  email: string;
  name: string;
  orderId: string;
  date: string;
  shippingAddress: Address;
  items: OrderItem[];
  shippingTotal: number;
  total: number;
}

export async function sendOrderConfirmationEmail({
  email,
  name,
  orderId,
  date,
  shippingAddress,
  items,
  shippingTotal,
  total,
}: OrderConfirmationEmailProps) {
  try {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const addressLines = [shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.postal_code, shippingAddress.country].filter(Boolean).join(', ');

    await resend.emails.send({
      from: 'Mcdodo UK <onboarding@resend.dev>',
      to: email,
      subject: `Order Confirmed - #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #ff6b35; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #eee; border-top: none; }
              .info-grid { width: 100%; margin-bottom: 20px; }
              .order-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .item { padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
              .totals-table { width: 100%; margin-top: 20px; border-top: 2px solid #ff6b35; padding-top: 10px; border-collapse: collapse; }
              .totals-table td { padding: 5px 0; font-size: 14px; }
              .totals-table .grand-total { font-size: 18px; font-weight: bold; color: #ff6b35; padding-top: 10px; }
              .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin:0;">Order Confirmed!</h1>
                <p style="margin:10px 0 0 0;">Thanks for your purchase, ${name}</p>
              </div>
              <div class="content">
                <table class="info-grid">
                  <tr>
                    <td style="vertical-align: top; width: 50%;">
                      <p style="margin:0; color:#666; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Order Date</p>
                      <p style="margin:5px 0 0 0; font-weight:bold;">${date}</p>
                    </td>
                    <td style="vertical-align: top; width: 50%; text-align:right;">
                      <p style="margin:0; color:#666; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Order ID</p>
                      <p style="margin:5px 0 0 0; font-weight:bold;">#${orderId}</p>
                    </td>
                  </tr>
                </table>
                <div style="margin-bottom: 30px;">
                  <p style="margin:0; color:#666; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Shipping To</p>
                  <p style="margin:5px 0 0 0; font-weight:bold;">${addressLines}</p>
                </div>
                <div class="order-details">
                  <h3 style="margin-top:0; border-bottom:1px solid #e5e7eb; padding-bottom:10px;">Order Summary</h3>
                  ${items.map(item => `
                    <div class="item">
                      <div style="font-weight:bold; margin-bottom: 4px;">${item.name}</div>
                      <div style="color: #555;">Quantity: ${item.quantity} &nbsp;&times;&nbsp; £${item.price.toFixed(2)}</div>
                    </div>
                  `).join('')}
                  <table class="totals-table">
                    <tr><td>Subtotal</td><td style="text-align: right;">£${subtotal.toFixed(2)}</td></tr>
                    <tr><td>Shipping</td><td style="text-align: right;">£${shippingTotal.toFixed(2)}</td></tr>
                    <tr><td class="grand-total">Total</td><td class="grand-total" style="text-align: right;">£${total.toFixed(2)}</td></tr>
                  </table>
                </div>
                <div style="margin-top: 30px;">
                  <h4 style="margin-bottom: 10px;">What's Next?</h4>
                  <p style="margin: 0 0 10px 0;">We'll process your order and ship it within 1-2 business days. You'll receive another email with tracking information once your order ships.</p>
                  <p style="margin: 0;">If you have any questions, feel free to contact us.</p>
                </div>
              </div>
              <div class="footer">
                <p>Mcdodo UK - Premium Charging Accessories</p>
                <p>This is an automated message, please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send confirmation:', error);
    return { success: false, error };
  }
}

// --- DISPATCH EMAIL ---

interface DispatchEmailProps {
  email: string;
  name: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  shippingAddress: Address; // Added
  items: OrderItem[];      // Added
}

export async function sendDispatchEmail({
  email,
  name,
  orderId,
  trackingNumber,
  carrier,
  shippingAddress,
  items,
}: DispatchEmailProps) {
  try {
    // Generate Tracking Link Logic
    let trackingUrl = '#';
    const c = carrier.toLowerCase();
    
    if (c.includes('royal')) trackingUrl = `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`;
    else if (c.includes('dpd')) trackingUrl = `https://track.dpd.co.uk/parcels/${trackingNumber}`;
    else if (c.includes('evri') || c.includes('hermes')) trackingUrl = `https://www.evri.com/track/parcel/${trackingNumber}`;
    else if (c.includes('dhl')) trackingUrl = `https://www.dhl.com/gb-en/home/tracking.html?tracking-id=${trackingNumber}`;
    else trackingUrl = `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}`;

    const addressLines = [shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.postal_code, shippingAddress.country].filter(Boolean).join(', ');

    await resend.emails.send({
      from: 'Mcdodo UK <onboarding@resend.dev>',
      to: email,
      subject: `Order Dispatched - #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #eee; border-top: none; }
              .tracking-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0; }
              .tracking-number { font-size: 20px; font-weight: bold; color: #059669; letter-spacing: 1px; margin: 10px 0; font-family: monospace; background: white; padding: 10px; border-radius: 4px; display: inline-block; }
              .btn-track { display: inline-block; background: #059669; color: white !important; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 6px; margin-top: 15px; }
              .section-title { font-size: 12px; text-transform: uppercase; color: #666; letter-spacing: 1px; margin: 0 0 5px 0; font-weight: bold; }
              .items-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
              .item-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; display: flex; justify-content: space-between; }
              .item-row:last-child { border-bottom: none; }
              .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin:0;">Order Dispatched!</h1>
                <p style="margin:10px 0 0 0;">Good news, ${name}</p>
              </div>
              
              <div class="content">
                <p>Your order <strong>#${orderId}</strong> has been packed and handed over to <strong>${carrier}</strong>.</p>
                
                <div class="tracking-box">
                  <div class="tracking-number">${trackingNumber}</div>
                  <br/>
                  <a href="${trackingUrl}" class="btn-track">Track Package</a>
                  <p style="margin: 10px 0 0 0; font-size:13px; color:#047857;">Note: Updates may take up to 24 hours to appear.</p>
                </div>

                <div style="margin-bottom: 25px;">
                  <p class="section-title">Shipping To</p>
                  <p style="margin: 0; font-weight: bold;">${addressLines}</p>
                </div>

                <div class="items-box">
                  <p class="section-title" style="margin-bottom: 10px;">Items in this Shipment</p>
                  ${items.map(item => `
                    <div class="item-row">
                      <span style="font-weight:bold;">${item.name}</span>
                      <span>x${item.quantity}</span>
                    </div>
                  `).join('')}
                </div>
                
                <p style="margin-top: 30px;">
                  Thank you for shopping with Mcdodo UK!
                </p>
              </div>
              
              <div class="footer">
                <p>Mcdodo UK - Premium Charging Accessories</p>
                <p>This is an automated message, please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send dispatch email:', error);
    return { success: false, error };
  }
}