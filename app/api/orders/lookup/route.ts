import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId || !sessionId.startsWith('cs_') || sessionId.length > 255) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 });
  }

  try {
    const rows = await sql`
      SELECT order_number
      FROM orders
      WHERE stripe_session_id = ${sessionId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { found: false },
        {
          status: 202,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    return NextResponse.json(
      { found: true, order_number: rows[0].order_number },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[Order Lookup] Failed:', error);
    return NextResponse.json(
      { error: 'Failed to look up order' },
      { status: 500 }
    );
  }
}
