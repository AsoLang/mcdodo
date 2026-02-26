// Path: app/api/admin/orders/[id]/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

const sql = neon(process.env.DATABASE_URL!);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('admin_auth');
    if (!adminAuth || !(await verifySessionToken(adminAuth.value))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    console.log(`[Delete API] Attempting to delete order: ${id}`);

    // Delete child rows first (old migrated orders have order_items FK constraint)
    await sql`
      DELETE FROM order_items
      WHERE order_id::text = ${id}
         OR order_id IN (
           SELECT id FROM orders WHERE order_number::text = ${id}
         )
    `;

    // FIX: Try to delete by matching 'id' column OR 'order_number' column
    // This handles both old imported orders (IDs like '303288') and new orders (UUIDs)
    const deletedOrders = await sql`
      DELETE FROM orders
      WHERE id::text = ${id}
         OR order_number::text = ${id}
      RETURNING id
    `;

    if (deletedOrders.length === 0) {
      console.log('[Delete API] No order found to delete.');
      // Return success anyway to clear it from UI if it doesn't exist in DB
      return NextResponse.json({ success: true, message: 'Order not found, assumed deleted' });
    }

    console.log(`[Delete API] Successfully deleted ${deletedOrders.length} order(s).`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Delete API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}