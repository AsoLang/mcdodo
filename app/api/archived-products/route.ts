import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const PAGE_SIZE = 9;

export async function GET(req: NextRequest) {
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') || '1'));
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const data = await sql`
      SELECT
        p.id,
        p.title,
        p.product_url,
        p.product_images,
        v.price,
        v.sale_price,
        v.on_sale,
        v.images as variant_images
      FROM products p
      LEFT JOIN LATERAL (
        SELECT price, sale_price, on_sale, images
        FROM product_variants
        WHERE product_id = p.id
        ORDER BY position ASC
        LIMIT 1
      ) v ON true
      WHERE p.visible = false
      ORDER BY p.id DESC
      LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
    `;

    const hasMore = data.length > PAGE_SIZE;
    const products = data.slice(0, PAGE_SIZE).map((item: any) => {
      let image = '/placeholder.jpg';
      if (item.product_images?.length > 0) image = item.product_images[0];
      else if (item.variant_images?.length > 0) image = item.variant_images[0];

      return {
        id: item.id,
        title: item.title,
        product_url: item.product_url,
        image,
        price: Number(item.price) || 0,
        sale_price: Number(item.sale_price) || 0,
        on_sale: item.on_sale || false,
      };
    });

    return NextResponse.json({ products, hasMore });
  } catch (error) {
    console.error('[archived-products] error:', error);
    return NextResponse.json({ products: [], hasMore: false }, { status: 500 });
  }
}
