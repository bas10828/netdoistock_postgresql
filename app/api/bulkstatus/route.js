import { pgPool } from '@/utils/db';
import { NextResponse } from 'next/server';

export async function PUT(req) {
  try {
    const body = await req.json();
    const { ids, status_stock } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'IDs are required' }, { status: 400 });
    }
    if (!status_stock) {
      return NextResponse.json({ message: 'status_stock is required' }, { status: 400 });
    }

    // Build SET clause dynamically — only update fields that are explicitly sent in body
    const sets = ['status_stock = $1'];
    const vals = [status_stock];
    let i = 2;

    if ('out_stock' in body)  { sets.push(`out_stock = $${i++}`);  vals.push(body.out_stock  ?? null); }
    if ('into_stock' in body) { sets.push(`into_stock = $${i++}`); vals.push(body.into_stock ?? null); }

    vals.push(ids);
    const query = `
      UPDATE equipment
      SET ${sets.join(', ')}
      WHERE id = ANY($${i}::int[])
      RETURNING id
    `;

    const { rows } = await pgPool.query(query, vals);

    return NextResponse.json({ message: `Updated ${rows.length} items`, count: rows.length }, { status: 200 });
  } catch (error) {
    console.error('Error bulk updating status:', error);
    return NextResponse.json({ message: 'Failed to update' }, { status: 500 });
  }
}
