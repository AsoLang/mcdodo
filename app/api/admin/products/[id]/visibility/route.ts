// Path: app/api/admin/products/[id]/visibility/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_auth')?.value;
  return token ? await verifySessionToken(token) : false;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { visible } = await request.json();

    console.log(`[Visibility API] Updating product ${id} to visible: ${visible}`);

    const updated = await sql`
      UPDATE products 
      SET visible = ${visible}
      WHERE id = ${id}
      RETURNING product_url
    `;

    const slug = updated?.[0]?.product_url as string | undefined;
    if (slug) revalidatePath(`/shop/p/${slug}`);
    revalidatePath('/shop');
    revalidatePath('/archive');
    revalidatePath('/categories');
    revalidatePath('/shop/wireless-earphones');
    revalidatePath('/api/shop/products');
    revalidatePath('/api/products/search');
    revalidatePath('/sitemap.xml');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Visibility API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update visibility', details: String(error) }, 
      { status: 500 }
    );
  }
}
