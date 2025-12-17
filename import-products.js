// Path: /import-products.js

require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const csv = require('csv-parser');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function importProducts() {
  const products = new Map();
  const variants = [];

  // Read CSV
  fs.createReadStream('products_Dec-17_01-31-42AM.csv')
    .pipe(csv())
    .on('data', (row) => {
      const productId = row['Product ID [Non Editable]'];
      const variantId = row['Variant ID [Non Editable]'];
      
      // Add product (only once per product ID)
      if (productId && !products.has(productId)) {
        products.set(productId, {
          id: productId,
          title: row['Title'],
          description: row['Description'],
          product_url: row['Product URL'],
          product_type: row['Product Type [Non Editable]'],
          categories: row['Categories'],
          tags: row['Tags'],
          visible: row['Visible'] === 'Yes'
        });
      }

      // Add variant
      if (variantId) {
        const images = row['Hosted Image URLs'] ? row['Hosted Image URLs'].split(' ') : [];
        
        variants.push({
          id: variantId,
          product_id: productId || null,
          sku: row['SKU'],
          option_name_1: row['Option Name 1'],
          option_value_1: row['Option Value 1'],
          option_name_2: row['Option Name 2'],
          option_value_2: row['Option Value 2'],
          price: parseFloat(row['Price']) || 0,
          sale_price: parseFloat(row['Sale Price']) || 0,
          on_sale: row['On Sale'] === 'Yes',
          stock: parseInt(row['Stock']) || 0,
          images: images
        });
      }
    })
    .on('end', async () => {
      console.log(`Found ${products.size} products and ${variants.length} variants`);

      try {
        // Insert products
        for (const [id, product] of products) {
          await sql`
            INSERT INTO products (id, title, description, product_url, product_type, categories, tags, visible)
            VALUES (${product.id}, ${product.title}, ${product.description}, ${product.product_url}, 
                    ${product.product_type}, ${product.categories}, ${product.tags}, ${product.visible})
            ON CONFLICT (id) DO NOTHING
          `;
        }
        console.log('✓ Products imported');

        // Insert variants
        for (const variant of variants) {
          await sql`
            INSERT INTO product_variants (id, product_id, sku, option_name_1, option_value_1, 
                                         option_name_2, option_value_2, price, sale_price, 
                                         on_sale, stock, images)
            VALUES (${variant.id}, ${variant.product_id}, ${variant.sku}, ${variant.option_name_1}, 
                    ${variant.option_value_1}, ${variant.option_name_2}, ${variant.option_value_2}, 
                    ${variant.price}, ${variant.sale_price}, ${variant.on_sale}, ${variant.stock}, 
                    ${variant.images})
            ON CONFLICT (id) DO NOTHING
          `;
        }
        console.log('✓ Variants imported');
        console.log('Done!');
        
      } catch (error) {
        console.error('Error importing:', error);
      }
    });
}

importProducts();