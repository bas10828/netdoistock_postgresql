import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request) {
  const loggedIn = request.headers.get('loggedIn');

  if (!loggedIn || loggedIn !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // PostgreSQL query
    const query = `SELECT * FROM schedule ORDER BY date_start ASC`;
    const { rows } = await pgPool.query(query);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
