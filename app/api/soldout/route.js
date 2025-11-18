import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request) {
  const loggedIn = request.headers.get('loggedIn');

  if (!loggedIn || loggedIn !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const query = `SELECT * FROM equipment WHERE status_stock = 'sold out'`;
    const { rows } = await pgPool.query(query);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
