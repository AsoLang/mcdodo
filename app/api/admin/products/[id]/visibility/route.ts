// Path: app/api/admin/products/[id]/visibility/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { visible } = await request.json();

    console.log(`[Visibility API] Updating product ${id} to visible: ${visible}`);

    await sql`
      UPDATE products 
      SET visible = ${visible}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Visibility API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update visibility', details: String(error) }, 
      { status: 500 }
    );
  }
}