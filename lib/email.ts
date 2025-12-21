// Path: lib/email.ts

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderConfirmationEmailProps {
  email: string;
  name: string;
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

export async function sendOrderConfirmationEmail({
  email,
  name,
  orderId,
  items,
  total,
}: OrderConfirmationEmailProps) {
  try {
    await resend.emails.send({
      from: 'Mcdodo UK <onboarding@resend.dev>',
      to: email,
      subject: `Order Confirmed - ${orderId.slice(0, 12)}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; }
              .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .item { padding: 15px 0; border-bottom: 1px solid #eee; }
              .total { font-size: 20px; font-weight: bold; color: #ff6b35; margin-top: 20px; padding-top: 20px; border-top: 2px solid #ff6b35; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Order Confirmed!</h1>
                <p>Thank you for your purchase, ${name}</p>
              </div>
              
              <div class="content">
                <p>We've received your order and it's being processed.</p>
                
                <div class="order-details">
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  
                  <h3>Order Items:</h3>
                  ${items.map(item => `
                    <div class="item">
                      <div><strong>${item.name}</strong></div>
                      <div>Quantity: ${item.quantity} × £${item.price.toFixed(2)}</div>
                    </div>
                  `).join('')}
                  
                  <div class="total">
                    Total: £${total.toFixed(2)}
                  </div>
                </div>
                
                <p><strong>What's Next?</strong></p>
                <p>We'll process your order and ship it within 1-2 business days. You'll receive another email with tracking information once your order ships.</p>
                
                <p>If you have any questions, feel free to contact us.</p>
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

interface DispatchEmailProps {
  email: string;
  name: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
}

export async function sendDispatchEmail({
  email,
  name,
  orderId,
  trackingNumber,
  carrier,
}: DispatchEmailProps) {
  try {
    await resend.emails.send({
      from: 'Mcdodo UK <orders@mcdodo.uk>',
      to: email,
      subject: `Order Dispatched - ${orderId.slice(0, 12)}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; }
              .tracking-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .tracking-number { font-size: 24px; font-weight: bold; color: #059669; margin: 20px 0; padding: 15px; background: #d1fae5; border-radius: 8px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📦 Order Dispatched!</h1>
                <p>Your order is on its way, ${name}</p>
              </div>
              
              <div class="content">
                <p>Great news! Your order has been dispatched and is on its way to you.</p>
                
                <div class="tracking-box">
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  <p><strong>Carrier:</strong> ${carrier}</p>
                  
                  <div class="tracking-number">
                    ${trackingNumber}
                  </div>
                  
                  <p style="color: #666; font-size: 14px;">Use this tracking number to monitor your delivery</p>
                </div>
                
                <p><strong>Expected Delivery:</strong> 2-3 business days</p>
                
                <p>You can track your package using the tracking number above.</p>
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