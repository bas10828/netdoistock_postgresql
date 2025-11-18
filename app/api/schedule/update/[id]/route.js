import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const { details, project, date_start, date_end, user } = await request.json();

    if (!details || !project || !date_start || !date_end || !user) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // อัปเดตข้อมูลใน PostgreSQL
    const updateQuery = `
      UPDATE schedule
      SET details = $1,
          project = $2,
          date_start = $3,
          date_end = $4,
          "user" = $5,
          timestamp = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    const values = [details, project, date_start, date_end, user, id];

    const { rows } = await pgPool.query(updateQuery, values);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 });
  }
}
