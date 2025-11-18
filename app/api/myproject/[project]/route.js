import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request, { params }) {
  const { project } = params;

  const query = "SELECT * FROM equipment WHERE project = $1";

  try {
    const { rows } = await pgPool.query(query, [project]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'No records found' }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
