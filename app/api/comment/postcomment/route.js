import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function POST(request) {
  try {
    const { serial, user, comment_text } = await request.json();

    if (!serial || !user || !comment_text) {
      return NextResponse.json(
        { error: "serial, user, and comment_text are required" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    const query = `
      INSERT INTO comment (serial, "user", timestamp, comment_text)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const values = [serial, user, timestamp, comment_text];

    const result = await pgPool.query(query, values);

    return NextResponse.json({
      id: result.rows[0].id,
      serial,
      user,
      timestamp,
      comment_text,
    });
  } catch (error) {
    console.error("POST comment error:", error);
    return NextResponse.json(
      { error: "Error executing query" },
      { status: 500 }
    );
  }
}
