// Path: app/api/admin/products/[id]/featured/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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