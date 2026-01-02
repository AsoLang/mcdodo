// Path: app/api/admin/royal-mail-export/route.ts

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const { orderIds } = await req.json();

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json({ error: 'No orders selected' }, { status: 400 });
    }

    // Fetch selected orders
    const orders = await sql`
      SELECT 
        order_number,
        customer_name,
        customer_email,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        weight_grams,
        service_type,
        total
      FROM orders
      WHERE id::text = ANY(${orderIds}) OR order_number::text = ANY(${orderIds})
    `;

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Orders not found' }, { status: 404 });
    }

    // Royal Mail Click & Drop exact template headers
    const headers = [
      'Order reference',
      'Recipient name',
      'Recipient address line 1',
      'Recipient address line 2',
      'Recipient address line 3',
      'Recipient town',
      'Recipient county',
      'Recipient postcode',
      'Recipient country code',
      'Service code',
      'Weight',
      'Email'
    ];

    const rows = orders.map((o: any) => [
      o.order_number || '',                          // Order reference
      o.customer_name || '',                         // Recipient name
      o.shipping_address_line1 || '',               // Address line 1
      o.shipping_address_line2 || '',               // Address line 2
      '',                                            // Address line 3 (empty)
      o.shipping_city || '',                        // Town
      '',                                            // County (empty)
      o.shipping_postal_code || '',                 // Postcode
      'GB',                                          // Country code
      o.service_type === 'large_letter' ? 'CRL2' : 'CRL2P',  // Service code (CRL2 = 2nd Class Letter, CRL2P = 2nd Class Parcel)
      o.weight_grams || '100',                       // Weight in grams
      o.customer_email || ''                         // Email
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="royal-mail-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error('[Royal Mail Export] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}