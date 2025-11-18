import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export async function GET(request, { params }) {
  const { model } = params; // ดึง model จาก URL

  try {
    const query = `
      SELECT * FROM equipment 
      WHERE model = $1 AND status_stock = 'in stock'
    `;
    const { rows } = await pgPool.query(query, [model]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error executing query:", error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}
