import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request, { params }) {
  const { model } = params;

  // query สำหรับ PostgreSQL
  const query = `
    SELECT *
    FROM equipment
    WHERE model ILIKE $1 OR model ILIKE $2
    ORDER BY CASE WHEN status_stock = 'in stock' THEN 1 ELSE 2 END
  `;
  const searchTerm = `%${model}%`;

  try {
    const result = await pgPool.query(query, [searchTerm, searchTerm]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "No records found" }, { status: 404 });
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
