// Run this to fix all products at once
// Usage: node scripts/fix-all-products.js

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function fixAllProducts() {
  console.log('🔍 Checking all products...\n');

  // Get all products
  const products = await sql`SELECT id, title, product_url, related_products FROM products WHERE visible = true`;
  
  console.log(`Found ${products.length} products\n`);

  // Step 1: Clear all related_products arrays (since old IDs don't exist)
  console.log('📝 Step 1: Clearing invalid related_products...');
  for (const product of products) {
    if (product.related_products && product.related_products.length > 0) {
      await sql`
        UPDATE products 
        SET related_products = ARRAY[]::text[]
        WHERE id = ${product.id}
      `;
      console.log(`  ✓ Cleared related_products for: ${product.title}`);
    }
  }

  // Step 2: Suggest related products for each product (same category)
  console.log('\n📝 Step 2: Adding new related products (by category)...');
  
  for (const product of products) {
    // Get product categories
    const prod = await sql`SELECT categories FROM products WHERE id = ${product.id}`;
    const categories = prod[0].categories || '';
    
    if (categories) {
      // Find other products in same category
      const related = await sql`
        SELECT id FROM products 
        WHERE categories LIKE ${`%${categories.split(',')[0].trim()}%`}
        AND id != ${product.id}
        AND visible = true
        LIMIT 3
      `;
      
      if (related.length > 0) {
        const relatedIds = related.map(r => r.id);
        await sql`
          UPDATE products 
          SET related_products = ${relatedIds}::text[]
          WHERE id = ${product.id}
        `;
        console.log(`  ✓ Added ${related.length} related products to: ${product.title}`);
      }
    }
  }

  // Step 3: Verify all product URLs are correct format
  console.log('\n📝 Step 3: Verifying product URLs...');
  for (const product of products) {
    if (!product.product_url || product.product_url.length === 24) {
      // Old Squarespace ID format (24 chars)
      console.log(`  ⚠️  WARNING: ${product.title} has ID-based URL: ${product.product_url}`);
      console.log(`     Should be slug format. Run migration to fix.`);
    } else {
      console.log(`  ✓ ${product.title}: ${product.product_url}`);
    }
  }

  console.log('\n✅ All done!\n');
  console.log('Summary:');
  console.log(`  - Cleared old related_products from all products`);
  console.log(`  - Added new related_products based on categories`);
  console.log(`  - Verified product_url formats`);
  console.log('\n💡 Next: Check your homepage/shop pages use product_url not id');
}

fixAllProducts().catch(console.error);