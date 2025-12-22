// Path: lib/email-templates.ts
import { Resend } from 'resend';

// Initialize Resend with the API key
const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderDetails {
  orderNumber: string | number;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  shippingTotal: number;
}

export async function sendOrderConfirmationEmail(order: OrderDetails) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Mcdodo UK <hello@mcdodo.co.uk>', // Updated Sender
      to: order.customerEmail,
      subject: 'Order received – Mcdodo',     // Updated Subject
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #ff6b35;">Thank you for your order!</h1>
          <p>Hi ${order.customerName},</p>
          <p>We have received your order <strong>#${order.orderNumber}</strong> and are getting it ready.</p>
          
          <div style="border-top: 1px solid #eee; margin: 20px 0; padding-top: 20px;">
            <h3 style="color: #555;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${order.items.map(item => `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                    <div><strong>${item.name}</strong></div>
                    <div style="color: #777; font-size: 0.9em;">Qty: ${item.quantity}</div>
                  </td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">
                    £${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              `).join('')}
              
              <tr>
                <td style="padding-top: 15px;">Shipping</td>
                <td style="padding-top: 15px; text-align: right;">£${order.shippingTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding-top: 5px; font-size: 1.1em; font-weight: bold;">Total</td>
                <td style="padding-top: 5px; text-align: right; font-size: 1.1em; font-weight: bold;">
                  £${order.total.toFixed(2)}
                </td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
            <p style="margin: 0; font-size: 0.9em; color: #666;">
              Need help? Just reply to this email.
            </p>
          </div>
          
          <p style="font-size: 0.8em; color: #999; margin-top: 30px; text-align: center;">
            Mcdodo UK • London
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Resend Error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Email Logic Exception:', err);
    return false;
  }
}