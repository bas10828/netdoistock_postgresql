import { pgPool } from '@/utils/db';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  try {
    console.log('Params:', params); // Debugging line

    // ดึง ID จาก params
    const { id } = params;

    // ตรวจสอบว่ามี ID หรือไม่
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // SQL query สำหรับการลบ comment
    const query = 'DELETE FROM comment WHERE id = $1';
    
    // Execute query
    const result = await pgPool.query(query, [id]);

    // ตรวจสอบว่ามีการลบแถวหรือไม่
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // ส่งคำตอบกลับว่า ลบสำเร็จ
    return NextResponse.json({ message: 'Comment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Error deleting comment' }, { status: 500 });
  }
}
