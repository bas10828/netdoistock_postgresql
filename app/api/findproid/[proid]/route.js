import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request, { params }) {
  const { proid } = params;

  const query = `
    SELECT *
    FROM equipment
    WHERE proid = $1
  `;

  try {
    const result = await pgPool.query(query, [proid]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "No records found" }, { status: 404 });
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
