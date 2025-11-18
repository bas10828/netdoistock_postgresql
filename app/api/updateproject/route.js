import { pgPool } from '@/utils/db';
import { NextResponse } from 'next/server';

export async function PUT(req) {
  try {
    const { id, project, statusStock } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
    }

    const query = `
      UPDATE equipment
      SET project = $1,
          status_stock = $2
      WHERE id = $3
      RETURNING *;
    `;

    const values = [project, statusStock, id];

    const { rows } = await pgPool.query(query, values);

    if (rows.length > 0) {
      return NextResponse.json({ message: 'Project updated successfully', data: rows[0] }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'No data updated' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ message: 'Failed to update project' }, { status: 500 });
  }
}
