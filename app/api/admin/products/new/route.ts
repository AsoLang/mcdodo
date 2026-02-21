// Path: app/api/admin/products/new/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'true';
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Return empty template for new product form
  return NextResponse.json({
    title: '',
    description: '',
    categories: '',
    seo_title: null,
    seo_description: null,
    seo_keywords: null,
    product_url: '',
    visible: true,
    featured: false,
    product_images: [],
    gallery_images: [],
    accordions: [],
    related_products: [],
    variants: []
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    
    const {
      title,
      description,
      categories,
      seo_title,
      seo_description,
      seo_keywords,
      product_url,
      visible = true,
      featured = false,
      product_images = [],
      gallery_images = [],
      accordions = [],
      related_products = [],
      variants = []
    } = body;

    // Validate required fields
    if (!title || !product_url) {
      return NextResponse.json(
        { error: 'Title and product URL are required' },
        { status: 400 }
      );
    }

    // Check if product URL already exists
    const existingProducts = await sql`
      SELECT id FROM products WHERE product_url = ${product_url}
    `;

    if (existingProducts.length > 0) {
      return NextResponse.json(
        { error: 'Product URL already exists' },
        { status: 400 }
      );
    }

    // Generate UUID for product ID
    const uuidResult = await sql`SELECT gen_random_uuid() as id`;
    const newProductId = uuidResult[0].id;

    // Insert product
    await sql`
      INSERT INTO products (
        id,
        title,
        description,
        categories,
        seo_title,
        seo_description,
        seo_keywords,
        product_url,
        visible,
        featured,
        product_images,
        gallery_images,
        accordions,
        related_products
      )
      VALUES (
        ${newProductId},
        ${title},
        ${description || ''},
        ${categories || ''},
        ${seo_title || null},
        ${seo_description || null},
        ${seo_keywords || null},
        ${product_url},
        ${visible},
        ${featured},
        ${product_images},
        ${gallery_images},
        ${accordions},
        ${related_products}
      )
    `;

    // Insert variants if provided
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        // Generate UUID for variant ID
        const variantUuidResult = await sql`SELECT gen_random_uuid() as id`;
        const newVariantId = variantUuidResult[0].id;

        await sql`
          INSERT INTO product_variants (
            id,
            product_id,
            sku,
            option_name_1,
            option_value_1,
            option_name_2,
            option_value_2,
            price,
            sale_price,
            on_sale,
            stock,
            images,
            color,
            size,
            position
          )
          VALUES (
            ${newVariantId},
            ${newProductId},
            ${variant.sku},
            ${variant.option_name_1 || null},
            ${variant.option_value_1 || null},
            ${variant.option_name_2 || null},
            ${variant.option_value_2 || null},
            ${variant.price},
            ${variant.sale_price || 0},
            ${variant.on_sale || false},
            ${variant.stock || 0},
            ${variant.images || []},
            ${variant.color || null},
            ${variant.size || null},
            ${variant.position || 0}
          )
        `;
      }
    }

    return NextResponse.json({
      success: true,
      productId: newProductId,
      message: 'Product created successfully'
    });

  } catch (error: any) {
    console.error('[New Product API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}