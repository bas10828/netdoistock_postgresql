import { pgPool } from '@/utils/db';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  try {
    console.log('Params:', params); // Debugging line

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // PostgreSQL ใช้ $1, $2... แทน ? และผลลัพธ์อยู่ที่ result.rowCount
    const query = 'DELETE FROM equipment WHERE id = $1';
    const result = await pgPool.query(query, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
  }
}
