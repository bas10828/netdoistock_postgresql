import { NextResponse } from 'next/server';
import { pgPool } from '@/utils/db';

// Insert a comment for each serial in the list (latest wins in byproject query)
export async function POST(req) {
  try {
    const { serials, user, comment_text } = await req.json();

    if (!serials || !Array.isArray(serials) || serials.length === 0) {
      return NextResponse.json({ message: 'serials array is required' }, { status: 400 });
    }
    if (!comment_text || !user) {
      return NextResponse.json({ message: 'user and comment_text are required' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // Build multi-row INSERT in one query
    const placeholders = serials.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ');
    const values = serials.flatMap(serial => [serial, user, timestamp, comment_text]);

    const { rowCount } = await pgPool.query(
      `INSERT INTO comment (serial, "user", timestamp, comment_text) VALUES ${placeholders}`,
      values
    );

    return NextResponse.json({ message: `Inserted ${rowCount} comments` }, { status: 201 });
  } catch (error) {
    console.error('POST bulkcomment error:', error);
    return NextResponse.json({ message: 'Failed to insert comments' }, { status: 500 });
  }
}
