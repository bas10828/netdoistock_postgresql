import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request, { params }) {
  const { id } = params;

  const query = "SELECT * FROM users WHERE id = $1";

  try {
    const { rows } = await pgPool.query(query, [id]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'No records found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
