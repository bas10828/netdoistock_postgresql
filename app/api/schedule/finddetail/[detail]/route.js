import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request, { params }) {
  const { detail } = params;

  // กำหนด pattern สำหรับ fuzzy search
  const searchTerm = `%${detail}%`;

  try {
    const query = `
      SELECT * FROM schedule
      WHERE details ILIKE $1 OR details ILIKE $2
    `;
    const values = [searchTerm, searchTerm];

    const { rows } = await pgPool.query(query, values);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'No records found' }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
