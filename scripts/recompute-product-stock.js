// Recompute products.stock from variant totals
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function recomputeProductStock() {
  const rows = await sql`
    SELECT p.id, COALESCE(SUM(pv.stock), 0)::int AS total_stock
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    GROUP BY p.id
  `;

  let updated = 0;
  for (const row of rows) {
    await sql`
      UPDATE products
      SET stock = ${row.total_stock}
      WHERE id = ${row.id}
    `;
    updated++;
  }

  console.log(JSON.stringify({ updated }, null, 2));
}

recomputeProductStock().catch((err) => {
  console.error(err);
  process.exit(1);
});
