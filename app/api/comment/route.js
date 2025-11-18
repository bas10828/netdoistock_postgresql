import { NextResponse } from "next/server";
import { query } from "@/utils/db"; // ใช้ query จาก db.js ของ PostgreSQL

export async function GET(request, { params }) {
  // const { serial } = params;
  // ตัวอย่าง query จาก table comment
  const queryText = "SELECT * FROM comment";

  try {
    const rows = await query(queryText); // query wrapper คืนเฉพาะ rows
    if (rows.length === 0) {
      return NextResponse.json({ message: 'No records found' }, { status: 404 });
    }
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
