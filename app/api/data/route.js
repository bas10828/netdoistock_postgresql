import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // all=true ใช้สำหรับ export excel (ดึงทั้งหมด)
  if (searchParams.get('all') === 'true') {
    try {
      const result = await pgPool.query('SELECT * FROM equipment ORDER BY id DESC');
      return NextResponse.json(result.rows);
    } catch (error) {
      console.error("Query error:", error);
      return NextResponse.json({ error: "Error executing query" }, { status: 500 });
    }
  }

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;

  try {
    const countResult = await pgPool.query('SELECT COUNT(*) FROM equipment');
    const total = parseInt(countResult.rows[0].count);

    const result = await pgPool.query(
      'SELECT * FROM equipment ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return NextResponse.json({
      data: result.rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
