// Path: app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Auth check helper
async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get product data
    const productData = await sql`
      SELECT * FROM products WHERE id = ${id}
    `;

    if (!productData || productData.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productData[0];

    // Get variants for this product
    const variants = await sql`
      SELECT * FROM product_variants WHERE product_id = ${id}
    `;

    // Combine product and variants
    const response = {
      ...product,
      variants: variants || []
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, categories, visible, featured, product_url, seo_title, seo_description, seo_keywords, variants } = body;

    // Update product
    await sql`
      UPDATE products
      SET 
        title = ${title},
        description = ${description},
        categories = ${categories},
        visible = ${visible},
        featured = ${featured},
        product_url = ${product_url},
        seo_title = ${seo_title},
        seo_description = ${seo_description},
        seo_keywords = ${seo_keywords}
      WHERE id = ${id}
    `;

    // Update variants if provided
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        await sql`
          UPDATE product_variants
          SET
            price = ${variant.price},
            sale_price = ${variant.sale_price},
            on_sale = ${variant.on_sale},
            stock = ${variant.stock},
            images = ${variant.images}
          WHERE id = ${variant.id} AND product_id = ${id}
        `;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Delete variants first (foreign key constraint)
    await sql`DELETE FROM product_variants WHERE product_id = ${id}`;
    
    // Delete product
    await sql`DELETE FROM products WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}