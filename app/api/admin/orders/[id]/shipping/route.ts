// Path: app/api/admin/orders/[id]/shipping/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { weight_grams, service_type } = await req.json();
    const { id } = await params;

    await sql`
      UPDATE orders
      SET 
        weight_grams = ${weight_grams},
        service_type = ${service_type}
      WHERE id = ${id} OR order_number::text = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Shipping Update] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}