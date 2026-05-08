import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const query = `SELECT * FROM users;`;
    const { rows } = await pgPool.query(query);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Error executing query' }, { status: 500 });
  }
}
