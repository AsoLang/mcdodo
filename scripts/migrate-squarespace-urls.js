// Path: scripts/migrate-squarespace-urls.js

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

function extractSlug(productUrl) {
  if (!productUrl) return null;
  
  // Current format: "/mcdodo-20w-double-usb-type-c-adapter"
  // or: "/shop/p/soft-36w"
  // We want just: "mcdodo-20w-double-usb-type-c-adapter" or "soft-36w"
  
  let slug = productUrl
    .replace(/^\/shop\/p\//, '')  // Remove /shop/p/ prefix
    .replace(/^\//, '')            // Remove leading slash
    .trim();
  
  return slug || null;
}

async function migrateSquarespaceUrls() {
  try {
    console.log('Fetching products from database...\n');
    
    const products = await sql`
      SELECT id, title, product_url 
      FROM products
    `;

    console.log(`Found ${products.length} total products\n`);

    let updated = 0;
    let alreadyClean = 0;
    let errors = 0;

    for (const product of products) {
      const currentUrl = product.product_url;
      
      if (!currentUrl) {
        console.log(`❌ Error: "${product.title}" - no product_url found`);
        errors++;
        continue;
      }

      // Extract clean slug
      const slug = extractSlug(currentUrl);

      if (!slug) {
        console.log(`❌ Error: "${product.title}" - couldn't extract slug from: ${currentUrl}`);
        errors++;
        continue;
      }

      // Check if already clean (no slashes)
      if (slug === currentUrl) {
        console.log(`✓ Already clean: "${product.title}" (${slug})`);
        alreadyClean++;
        continue;
      }

      // Update the product_url to clean slug
      await sql`
        UPDATE products 
        SET product_url = ${slug}
        WHERE id = ${product.id}
      `;
      
      console.log(`✅ Updated "${product.title}"`);
      console.log(`   Old: ${currentUrl}`);
      console.log(`   New: ${slug}`);
      console.log(`   URL: https://mcdodo.co.uk/shop/p/${slug}\n`);
      updated++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Complete!');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updated} products`);
    console.log(`✓  Already clean: ${alreadyClean} products`);
    console.log(`❌ Errors: ${errors} products`);
    console.log('='.repeat(60));
    console.log(`\nAll products now accessible at: https://mcdodo.co.uk/shop/p/[slug]`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  }
}

migrateSquarespaceUrls();