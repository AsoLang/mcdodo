import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

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
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const productData = await sql`SELECT * FROM products WHERE id = ${id}`;
    if (!productData || productData.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productData[0];
    const variants = await sql`
      SELECT * FROM product_variants 
      WHERE product_id = ${id} 
      ORDER BY position ASC
    `;

    return NextResponse.json({
      ...product,
      variants: variants || []
    });
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
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      title, description, categories, visible, featured, product_url, 
      seo_title, seo_description, seo_keywords, variants,
      accordions, gallery_images, review_count, review_rating, related_products
    } = body;

    console.log('=== UPDATING PRODUCT ===');
    console.log('Product ID:', id);
    console.log('Product Images:', body.product_images?.length || 0);
    console.log('Number of variants:', variants?.length);

    // Update product
    try {
      await sql`
        UPDATE products
        SET 
          title = ${title},
          description = ${description},
          categories = ${categories},
          visible = ${visible},
          featured = ${featured},
          product_url = ${product_url},
          seo_title = ${seo_title || null},
          seo_description = ${seo_description || null},
          seo_keywords = ${seo_keywords || null},
          accordions = ${JSON.stringify(accordions || [])},
          product_images = ${body.product_images || []},
          gallery_images = ${gallery_images || []},
          review_count = ${review_count || 0},
          review_rating = ${review_rating || 5},
          related_products = ${related_products || []}
        WHERE id = ${id}
      `;
      console.log('✓ Product updated');
    } catch (prodError) {
      console.error('✗ Product update failed:', prodError);
      throw new Error(`Product update failed: ${prodError}`);
    }

    // Handle variants
    if (variants && Array.isArray(variants)) {
      console.log('Processing', variants.length, 'variants...');
      
      // STEP 1: Get existing variant IDs from database
      const existingVariants = await sql`
        SELECT id FROM product_variants WHERE product_id = ${id}
      `;
      const existingVariantIds = existingVariants.map((v: any) => v.id);
      console.log('Existing variant IDs in DB:', existingVariantIds);
      
      // STEP 2: Get incoming variant IDs (exclude temp_ IDs)
      const incomingVariantIds = variants
        .filter((v: any) => !String(v.id).startsWith('temp_'))
        .map((v: any) => v.id);
      console.log('Incoming variant IDs:', incomingVariantIds);
      
      // STEP 3: Find and DELETE removed variants
      const variantsToDelete = existingVariantIds.filter(
        (existingId: string) => !incomingVariantIds.includes(existingId)
      );
      
      if (variantsToDelete.length > 0) {
        console.log('Deleting', variantsToDelete.length, 'removed variants:', variantsToDelete);
        for (const variantId of variantsToDelete) {
          try {
            await sql`DELETE FROM product_variants WHERE id = ${variantId}`;
            console.log('✓ Deleted variant:', variantId);
          } catch (deleteError) {
            console.error('✗ Failed to delete variant:', variantId, deleteError);
          }
        }
      }
      
      // STEP 4: Update or Insert remaining variants
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const position = i;
        
        console.log(`\nVariant ${i + 1}:`, {
          id: variant.id,
          color: variant.color,
          size: variant.size,
          price: variant.price,
          stock: variant.stock,
          images: variant.images?.length || 0,
          position: position
        });
        
        const variantImages = Array.isArray(variant.images) ? variant.images : [];
        
        if (String(variant.id).startsWith('temp_')) {
          console.log('→ Inserting new variant...');
          
          const newVariantId = crypto.randomUUID();
          
          try {
            const result = await sql`
              INSERT INTO product_variants (
                id,
                product_id, 
                sku, 
                option_value_1, 
                color, 
                size, 
                price, 
                sale_price, 
                on_sale, 
                stock, 
                images,
                position
              ) VALUES (
                ${newVariantId},
                ${id},
                ${variant.sku || `SKU-${Date.now()}`},
                ${variant.option_value_1 || 'Default'},
                ${variant.color || null},
                ${variant.size || null},
                ${Number(variant.price) || 0},
                ${Number(variant.sale_price) || Number(variant.price) || 0},
                ${Boolean(variant.on_sale)},
                ${Number(variant.stock) || 0},
                ${variantImages}::text[],
                ${position}
              )
              RETURNING id
            `;
            console.log('✓ Variant inserted, new ID:', result[0]?.id);
          } catch (insertError: any) {
            console.error('✗ Insert failed:', insertError);
            throw new Error(`Variant insert failed: ${insertError.message}`);
          }
        } else {
          console.log('→ Updating existing variant...');
          
          try {
            await sql`
              UPDATE product_variants
              SET
                color = ${variant.color || null},
                size = ${variant.size || null},
                option_value_1 = ${variant.option_value_1 || 'Default'},
                sku = ${variant.sku || 'SKU-DEFAULT'},
                price = ${Number(variant.price) || 0},
                sale_price = ${Number(variant.sale_price) || Number(variant.price) || 0},
                on_sale = ${Boolean(variant.on_sale)},
                stock = ${Number(variant.stock) || 0},
                images = ${variantImages}::text[],
                position = ${position}
              WHERE id = ${variant.id} AND product_id = ${id}
            `;
            console.log('✓ Variant updated');
          } catch (updateError: any) {
            console.error('✗ Update failed:', updateError);
            throw new Error(`Variant update failed: ${updateError.message}`);
          }
        }
      }
    }

    console.log('=== UPDATE COMPLETE ===\n');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('=== UPDATE FAILED ===');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to update product',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await sql`DELETE FROM product_variants WHERE product_id = ${id}`;
    await sql`DELETE FROM products WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}