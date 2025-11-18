import { pgPool } from '@/utils/db';
import { NextResponse } from 'next/server';

export async function PUT(req) {
  try {
    const { id, proid, serial, mac, status_stock, into_stock, out_stock, price, brand, model, project, purchase } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
    }

    const query = `
      UPDATE equipment 
      SET proid = $1,
          serial = $2,
          mac = $3,
          status_stock = $4,
          into_stock = $5,
          out_stock = $6,
          price = $7,
          brand = $8,
          model = $9,
          project = $10,
          purchase = $11
      WHERE id = $12
      RETURNING *;
    `;

    const values = [proid, serial, mac, status_stock, into_stock, out_stock, price, brand, model, project, purchase, id];

    const { rows } = await pgPool.query(query, values);

    if (rows.length > 0) {
      return NextResponse.json({ message: 'Data updated successfully', data: rows[0] }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'No data updated' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating data:', error);
    return NextResponse.json({ message: 'Failed to update data' }, { status: 500 });
  }
}
