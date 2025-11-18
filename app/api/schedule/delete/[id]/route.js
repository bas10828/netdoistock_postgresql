import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function DELETE(req, { params }) {
  try {
    console.log('Params:', params); // Debugging line

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    // PostgreSQL ใช้ $1 สำหรับ parameterized query
    const query = `DELETE FROM schedule WHERE id = $1 RETURNING *`;
    const values = [id];

    const { rows } = await pgPool.query(query, values);

    // ตรวจสอบว่ามีแถวถูกลบหรือไม่
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Schedule deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Error deleting schedule' }, { status: 500 });
  }
}
