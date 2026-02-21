// Path: app/api/admin/products/[id]/featured/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

const sql = neon(process.env.DATABASE_URL!);

async function isAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === 'true';
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
    const { featured } = await request.json();

    console.log(`[Featured API] Updating product ${id} to featured: ${featured}`);

    await sql`
      UPDATE products 
      SET featured = ${featured}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Featured API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update featured status', details: String(error) }, 
      { status: 500 }
    );
  }
}