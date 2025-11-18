import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request) {
  const loggedIn = request.headers.get("loggedIn");

  if (!loggedIn || loggedIn !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queryText = `SELECT * FROM equipment`;

  try {
    const result = await pgPool.query(queryText);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
