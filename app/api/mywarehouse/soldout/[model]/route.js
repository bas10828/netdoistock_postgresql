import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request, { params }) {
  const { model } = params;
  const promisePool = pgPool;

  try {
    const query = `SELECT * FROM equipment WHERE model = $1 AND status_stock = 'sold out'`;
    const { rows } = await promisePool.query(query, [model]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
