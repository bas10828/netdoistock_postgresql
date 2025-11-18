import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request, { params }) {
  const { proid } = params;

  if (!proid) {
    return NextResponse.json({ error: "Missing proid parameter" }, { status: 400 });
  }

  const queryText = `
    SELECT proid, brand, model
    FROM equipment
    WHERE proid = $1
    LIMIT 1
  `;

  try {
    const result = await pgPool.query(queryText, [proid]);

    if (!result || !result.rows || result.rows.length === 0) {
      return NextResponse.json({ message: "No records found" }, { status: 404 });
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("PostgreSQL query error:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
