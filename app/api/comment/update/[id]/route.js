import { NextResponse } from 'next/server';
import { pgPool } from '@/utils/db';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { serial, user, comment_text } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }
    if (!serial) {
      return NextResponse.json({ error: "Missing 'serial' parameter" }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();

    const query = `
      UPDATE comment
      SET "user" = $1,
          timestamp = $2,
          comment_text = $3,
          serial = $4
      WHERE id = $5
      RETURNING id;
    `;

    const values = [user, currentTimestamp, comment_text, serial, id];

    const result = await pgPool.query(query, values);

    if (result.rowCount > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "No comment found to update" }, { status: 404 });
    }
  } catch (error) {
    console.error("PUT comment error:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
