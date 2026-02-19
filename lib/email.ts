// Path: lib/email.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
  color?: string | null;
  size?: string | null;
  product_url?: string | null;
}

interface OrderConfirmationEmailProps {
  email: string;
  name: string;
  orderId: string;
  date: string | Date; // Allow both
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
    // --- 1970 DATE FIX ---
    let displayDate = '';
    const dateObj = new Date(date);
    
    // If invalid, null, or year is 1970, use TODAY
    if (!date || isNaN(dateObj.getTime()) || dateObj.getFullYear() <= 1970) {
      displayDate = new Date().toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
    } else {
      displayDate = dateObj.toLocaleDateString('en-GB', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
    }

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const addressLines = [
      shippingAddress.line1, 
      shippingAddress.line2, 
      shippingAddress.city, 
      shippingAddress.postal_code, 
      shippingAddress.country
    ].filter(Boolean).join(', ');

    await resend.emails.send({
      from: 'Mcdodo UK <orders@mcdodo.co.uk>',
      to: email,
      subject: `Order Confirmed - #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #ea580c; }
            .logo { font-size: 24px; font-weight: 900; color: #000; letter-spacing: -1px; text-decoration: none; }
            .logo span { color: #ea580c; }
            .order-info { margin: 30px 0; text-align: center; background-color: #f9fafb; padding: 20px; border-radius: 12px; }
            .order-id { font-size: 20px; font-weight: bold; color: #000; }
            .date { color: #666; font-size: 14px; margin-top: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { text-align: left; border-bottom: 1px solid #eee; padding: 10px; color: #666; font-size: 12px; text-transform: uppercase; }
            .items-table td { border-bottom: 1px solid #eee; padding: 15px 10px; vertical-align: middle; }
            .item-name { font-weight: 600; color: #000; }
            .totals { margin-top: 20px; text-align: right; }
            .total-row { padding: 5px 0; }
            .grand-total { font-size: 18px; font-weight: bold; color: #ea580c; border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px; }
            .address-section { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Mc<span>dodo</span> UK</div>
            </div>

            <p>Hi <strong>${name}</strong>,</p>
            <p>Thank you for your order! We've received it and are getting it ready.</p>

            <div class="order-info">
              <div class="order-id">Order #${orderId}</div>
              <div class="date">${displayDate}</div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th width="60%">Item</th>
                  <th width="20%" style="text-align:center">Qty</th>
                  <th width="20%" style="text-align:right">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>
                      <div class="item-name">${item.name}</div>
                      ${(item.color || item.size) ? `<div class="item-meta">${[item.color, item.size].filter(Boolean).join(' · ')}</div>` : ''}
                    </td>
                    <td style="text-align:center">${item.quantity}</td>
                    <td style="text-align:right">£${Number(item.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">Subtotal: £${subtotal.toFixed(2)}</div>
              <div class="total-row">Shipping: £${Number(shippingTotal).toFixed(2)}</div>
              <div class="total-row grand-total">Total: £${Number(total).toFixed(2)}</div>
            </div>

            <div class="address-section">
              <strong>Shipping to:</strong><br/>
              ${addressLines}
            </div>

            <div class="footer">
              <p>Questions? Reply to this email or contact support@mcdodo.co.uk</p>
              <p>© ${new Date().getFullYear()} Mcdodo UK. All rights reserved.</p>
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

interface AdminOrderNotificationEmailProps {
  email: string;
  orderId: string;
  date: string | Date;
  customerName: string;
  customerEmail: string;
  shippingAddress: Address;
  items: OrderItem[];
  shippingTotal: number;
  total: number;
}

export async function sendAdminOrderNotificationEmail({
  email,
  orderId,
  date,
  customerName,
  customerEmail,
  shippingAddress,
  items,
  shippingTotal,
  total,
}: AdminOrderNotificationEmailProps) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.mcdodo.co.uk';
    let displayDate = '';
    const dateObj = new Date(date);

    if (!date || isNaN(dateObj.getTime()) || dateObj.getFullYear() <= 1970) {
      displayDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } else {
      displayDate = dateObj.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    }

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const addressLines = [
      shippingAddress.line1,
      shippingAddress.line2,
      shippingAddress.city,
      shippingAddress.postal_code,
      shippingAddress.country
    ].filter(Boolean).join(', ');

    await resend.emails.send({
      from: 'Mcdodo UK <orders@mcdodo.co.uk>',
      to: email,
      subject: `New Order - #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111; }
            .container { max-width: 640px; margin: 0 auto; padding: 20px; }
            .header { border-bottom: 2px solid #ea580c; padding-bottom: 12px; }
            .title { font-size: 20px; font-weight: 800; }
            .muted { color: #666; font-size: 13px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            .items-table th { text-align: left; border-bottom: 1px solid #eee; padding: 10px; color: #666; font-size: 12px; text-transform: uppercase; }
            .items-table td { border-bottom: 1px solid #eee; padding: 12px 10px; vertical-align: middle; }
            .item-name { font-weight: 600; }
            .item-meta { color: #666; font-size: 12px; margin-top: 2px; }
            .totals { margin-top: 16px; text-align: right; }
            .grand-total { font-size: 18px; font-weight: 700; color: #ea580c; border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px; }
            .section { margin-top: 20px; }
            .label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #666; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="title">New Order #${orderId}</div>
              <div class="muted">${displayDate}</div>
            </div>

            <div class="section">
              <div class="label">Customer</div>
              <div>${customerName} (${customerEmail})</div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th width="60%">Item</th>
                  <th width="20%" style="text-align:center">Qty</th>
                  <th width="20%" style="text-align:right">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>
                      <div class="item-name">
                        ${item.product_url ? `<a href="${baseUrl}/shop/p/${item.product_url}" style="color:#111;text-decoration:underline;">${item.name}</a>` : item.name}
                      </div>
                      ${(item.color || item.size) ? `<div class="item-meta">${[item.color, item.size].filter(Boolean).join(' · ')}</div>` : ''}
                    </td>
                    <td style="text-align:center">${item.quantity}</td>
                    <td style="text-align:right">£${Number(item.price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div>Subtotal: £${subtotal.toFixed(2)}</div>
              <div>Shipping: £${Number(shippingTotal).toFixed(2)}</div>
              <div class="grand-total">Total Paid: £${Number(total).toFixed(2)}</div>
            </div>

            <div class="section">
              <div class="label">Shipping Address</div>
              <div>${addressLines || 'Address not available'}</div>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send admin order email:', error);
    return { success: false, error };
  }
}

// --- DISPATCH EMAIL (Keep existing) ---
interface DispatchEmailProps {
  email: string;
  name: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  shippingAddress: Address;
  items: OrderItem[];
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
    let trackingUrl = '#';
    const c = carrier.toLowerCase();
    
    if (c.includes('royal')) trackingUrl = `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`;
    else if (c.includes('dpd')) trackingUrl = `https://track.dpd.co.uk/parcels/${trackingNumber}`;
    else if (c.includes('evri')) trackingUrl = `https://www.evri.com/track/parcel/${trackingNumber}`;
    else if (c.includes('dhl')) trackingUrl = `https://www.dhl.com/gb-en/home/tracking.html?tracking-id=${trackingNumber}`;
    else trackingUrl = `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}`;

    const addressLines = [
      shippingAddress.line1, 
      shippingAddress.line2, 
      shippingAddress.city, 
      shippingAddress.postal_code, 
      shippingAddress.country
    ].filter(Boolean).join(', ');

    await resend.emails.send({
      from: 'Mcdodo UK <orders@mcdodo.co.uk>',
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
