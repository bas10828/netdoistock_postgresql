import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request, { params }) {
  const { serial } = params;

  const query = "SELECT COUNT(*) AS count FROM comment WHERE serial = $1"; // ใช้ $1 สำหรับ PostgreSQL

  try {
    const { rows } = await pgPool.query(query, [serial]);

    // PostgreSQL จะคืนค่า count เป็น string ต้องแปลงเป็น number
    const count = rows[0]?.count ? parseInt(rows[0].count, 10) : 0;

    return NextResponse.json([{ count }]);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error executing query" },
      { status: 500 }
    );
  }
}
