import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function POST(request) {
  try {
    const { details, project, date_start, date_end, user } = await request.json();

    // ตรวจสอบว่ามีข้อมูลจำเป็นครบหรือไม่
    if (!details || !project || !date_start || !date_end || !user) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // PostgreSQL ใช้ NOW() สำหรับ timestamp และไม่ต้องตั้ง time_zone แบบ MySQL
    const insertQuery = `
      INSERT INTO schedule (details, project, date_start, date_end, "user", timestamp)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;

    // ใช้ $1, $2,... สำหรับ parameterized query
    const values = [details, project, date_start, date_end, user];

    const { rows } = await pgPool.query(insertQuery, values);

    // rows[0] คือแถวที่เพิ่ง insert
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("Error inserting data:", error);
    return NextResponse.json({ error: "Failed to add data" }, { status: 500 });
  }
}
