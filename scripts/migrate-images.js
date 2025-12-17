// Path: /scripts/migrate-images.js

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const { put } = require('@vercel/blob');
const https = require('https');
const http = require('http');

const sql = neon(process.env.DATABASE_URL);

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

async function migrateImages() {
  console.log('Starting image migration...\n');

  // Get all variants with images
  const variants = await sql`
    SELECT id, images FROM product_variants WHERE images IS NOT NULL
  `;

  console.log(`Found ${variants.length} variants with images\n`);

  for (const variant of variants) {
    if (!variant.images || variant.images.length === 0) continue;

    console.log(`Processing variant ${variant.id}...`);
    const newImages = [];

    for (let i = 0; i < variant.images.length; i++) {
      const imageUrl = variant.images[i];
      
      try {
        console.log(`  Downloading image ${i + 1}/${variant.images.length}...`);
        const imageBuffer = await downloadImage(imageUrl);
        
        // Extract filename from URL
        const filename = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
        
        console.log(`  Uploading to Vercel Blob...`);
        const blob = await put(filename, imageBuffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        newImages.push(blob.url);
        console.log(`  ✓ Uploaded: ${blob.url}`);
        
      } catch (error) {
        console.error(`  ✗ Error processing image: ${error.message}`);
        // Keep original URL if upload fails
        newImages.push(imageUrl);
      }
    }

    // Update database with new URLs
    await sql`
      UPDATE product_variants 
      SET images = ${newImages}
      WHERE id = ${variant.id}
    `;
    
    console.log(`✓ Updated variant ${variant.id} with ${newImages.length} images\n`);
  }

  console.log('Migration complete!');
}

migrateImages().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});