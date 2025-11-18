import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request, { params }) {
  const { serial } = params;

  const query = "SELECT * FROM comment WHERE serial = $1"; // ใช้ $1 สำหรับ PostgreSQL

  try {
    const { rows } = await pgPool.query(query, [serial]);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No records found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error executing query" },
      { status: 500 }
    );
  }
}
