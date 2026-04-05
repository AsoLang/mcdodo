import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const PUBLIC_CACHE_HEADER = 'public, max-age=120, s-maxage=86400, stale-while-revalidate=604800';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const [product] = await sql`
      SELECT id, title, description, product_url
      FROM products
      WHERE product_url = ${slug} AND visible = true
    `;

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const variants = await sql`
      SELECT id, option_value_1, color, size, sku, price, sale_price, on_sale, stock, images
      FROM product_variants
      WHERE product_id = ${product.id}
      ORDER BY price ASC
    `;

    return NextResponse.json(
      { ...product, variants },
      {
        headers: {
          'Cache-Control': PUBLIC_CACHE_HEADER,
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
