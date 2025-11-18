import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function DELETE(req, { params }) {
  try {
    console.log('Params:', params); // Debugging line

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const values = [id];

    const { rowCount } = await pgPool.query(query, values);

    if (rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
  }
}
