// Path: scripts/check-database.js

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function checkDatabase() {
  try {
    console.log('Checking database structure...\n');
    
    // Get column information
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `;

    console.log('Products table columns:');
    console.log('='.repeat(50));
    columns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('\nSample product data:');
    console.log('='.repeat(50));
    
    const sample = await sql`
      SELECT * FROM products LIMIT 1
    `;
    
    if (sample.length > 0) {
      console.log(JSON.stringify(sample[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();