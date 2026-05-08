import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

// GET - Fetch record by model
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { model } = params;

  try {
    const query = `SELECT * FROM library WHERE model = $1`;
    const { rows } = await pgPool.query(query, [model]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
