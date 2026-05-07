import { NextResponse } from "next/server";
import { query } from "@/utils/db"; // ใช้ PostgreSQL query wrapper

export async function GET() {
  const queryText = `
    SELECT project, COUNT(project) AS countproject 
    FROM equipment 
    GROUP BY project 
    ORDER BY project ASC;
  `;

  try {
    const rows = await query(queryText); // query wrapper คืนเฉพาะ rows
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
