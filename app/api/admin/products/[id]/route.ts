// Path: app/api/admin/products/[id]/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    console.log('Fetching product with ID:', id);

    // Fetch product
    const productResult = await sql`
      SELECT * FROM products WHERE id = ${id}
    `;

    console.log('Product result:', productResult);

    if (productResult.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productResult[0];

    // Fetch variants
    const variantsResult = await sql`
      SELECT * FROM product_variants WHERE product_id = ${id}
    `;

    console.log('Variants result:', variantsResult);

    const variants = variantsResult.map(v => ({
      ...v,
      images: typeof v.images === 'string' ? JSON.parse(v.images) : (v.images || []),
    }));

    const response = {
      ...product,
      variants: variants || [],
    };

    console.log('Returning response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    // Update product
    await sql`
      UPDATE products 
      SET 
        title = ${body.title},
        description = ${body.description},
        categories = ${body.categories},
        visible = ${body.visible},
        featured = ${body.featured || false},
        product_url = ${body.product_url},
        seo_title = ${body.seo_title || null},
        seo_description = ${body.seo_description || null},
        seo_keywords = ${body.seo_keywords || null}
      WHERE id = ${id}
    `;

    // Update variants
    if (body.variants && Array.isArray(body.variants)) {
      for (const variant of body.variants) {
        await sql`
          UPDATE product_variants 
          SET 
            price = ${variant.price},
            sale_price = ${variant.sale_price},
            on_sale = ${variant.on_sale},
            stock = ${variant.stock},
            images = ${JSON.stringify(variant.images || [])}
          WHERE id = ${variant.id}
        `;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update failed:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Delete variants first (foreign key constraint)
    await sql`DELETE FROM product_variants WHERE product_id = ${id}`;

    // Delete product
    await sql`DELETE FROM products WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete failed:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}