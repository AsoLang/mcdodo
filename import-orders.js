// Path: /import-orders.js

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const csv = require('csv-parser');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function importOrders() {
  const orders = new Map();
  const orderItems = [];
  const customers = new Map();

  // Read CSV
  fs.createReadStream('orders.csv')
    .pipe(csv())
    .on('data', (row) => {
      const orderId = row['Order ID'];
      const email = row['Email'];

      // Add order (only once per order ID)
      if (orderId && !orders.has(orderId)) {
        orders.set(orderId, {
          id: orderId,
          email: email,
          financial_status: row['Financial Status'],
          fulfillment_status: row['Fulfillment Status'],
          currency: row['Currency'],
          subtotal: parseFloat(row['Subtotal']) || 0,
          shipping: parseFloat(row['Shipping']) || 0,
          taxes: parseFloat(row['Taxes']) || 0,
          total: parseFloat(row['Total']) || 0,
          discount_code: row['Discount Code'],
          discount_amount: parseFloat(row['Discount Amount']) || 0,
          shipping_method: row['Shipping Method'],
          payment_method: row['Payment Method'],
          payment_reference: row['Payment Reference'],
          created_at: row['Created at'],
          paid_at: row['Paid at'],
          fulfilled_at: row['Fulfilled at'] || null
        });
      }

      // Add order item
      if (orderId && row['Lineitem name']) {
        orderItems.push({
          order_id: orderId,
          product_name: row['Lineitem name'],
          sku: row['Lineitem sku'],
          variant: row['Lineitem variant'],
          quantity: parseInt(row['Lineitem quantity']) || 1,
          price: parseFloat(row['Lineitem price']) || 0
        });
      }

      // Add customer (only once per email)
      if (email && !customers.has(email)) {
        customers.set(email, {
          email: email,
          billing_name: row['Billing Name'],
          billing_address1: row['Billing Address1'],
          billing_city: row['Billing City'],
          billing_zip: row['Billing Zip'],
          billing_country: row['Billing Country'],
          billing_phone: row['Billing Phone'],
          shipping_name: row['Shipping Name'],
          shipping_address1: row['Shipping Address1'],
          shipping_city: row['Shipping City'],
          shipping_zip: row['Shipping Zip'],
          shipping_country: row['Shipping Country'],
          shipping_phone: row['Shipping Phone']
        });
      }
    })
    .on('end', async () => {
      console.log(`Found ${orders.size} orders, ${orderItems.length} items, ${customers.size} customers`);

      try {
        // Insert customers
        for (const [email, customer] of customers) {
          await sql`
            INSERT INTO customers (email, billing_name, billing_address1, billing_city, billing_zip, 
                                  billing_country, billing_phone, shipping_name, shipping_address1, 
                                  shipping_city, shipping_zip, shipping_country, shipping_phone)
            VALUES (${customer.email}, ${customer.billing_name}, ${customer.billing_address1}, 
                    ${customer.billing_city}, ${customer.billing_zip}, ${customer.billing_country}, 
                    ${customer.billing_phone}, ${customer.shipping_name}, ${customer.shipping_address1}, 
                    ${customer.shipping_city}, ${customer.shipping_zip}, ${customer.shipping_country}, 
                    ${customer.shipping_phone})
            ON CONFLICT (email) DO NOTHING
          `;
        }
        console.log('✓ Customers imported');

        // Insert orders
        for (const [id, order] of orders) {
          await sql`
            INSERT INTO orders (id, email, financial_status, fulfillment_status, currency, subtotal, 
                               shipping, taxes, total, discount_code, discount_amount, shipping_method, 
                               payment_method, payment_reference, created_at, paid_at, fulfilled_at)
            VALUES (${order.id}, ${order.email}, ${order.financial_status}, ${order.fulfillment_status}, 
                    ${order.currency}, ${order.subtotal}, ${order.shipping}, ${order.taxes}, ${order.total}, 
                    ${order.discount_code}, ${order.discount_amount}, ${order.shipping_method}, 
                    ${order.payment_method}, ${order.payment_reference}, ${order.created_at}, 
                    ${order.paid_at}, ${order.fulfilled_at})
            ON CONFLICT (id) DO NOTHING
          `;
        }
        console.log('✓ Orders imported');

        // Insert order items
        for (const item of orderItems) {
          await sql`
            INSERT INTO order_items (order_id, product_name, sku, variant, quantity, price)
            VALUES (${item.order_id}, ${item.product_name}, ${item.sku}, ${item.variant}, 
                    ${item.quantity}, ${item.price})
          `;
        }
        console.log('✓ Order items imported');
        console.log('Done!');
        
      } catch (error) {
        console.error('Error importing:', error);
      }
    });
}

importOrders();