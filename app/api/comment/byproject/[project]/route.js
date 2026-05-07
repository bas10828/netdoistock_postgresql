import { NextResponse } from 'next/server';
import { pgPool } from '@/utils/db';

// Returns the latest comment per serial for all equipment in a project
export async function GET(request, { params }) {
  const project = decodeURIComponent(params.project);
  try {
    const { rows } = await pgPool.query(
      `SELECT DISTINCT ON (c.serial)
         c.id, c.serial, c.comment_text, c."user", c.timestamp
       FROM comment c
       INNER JOIN equipment e ON e.serial = c.serial
       WHERE e.project = $1
       ORDER BY c.serial, c.timestamp DESC`,
      [project]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET byproject comment error:', error);
    return NextResponse.json({ error: 'Error executing query' }, { status: 500 });
  }
}
