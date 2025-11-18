import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";
import moment from "moment-timezone";

export async function GET(request) {
  const loggedIn = request.headers.get('loggedIn');

  if (!loggedIn || loggedIn !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = moment().startOf('day').format('YYYY-MM-DD');

  try {
    const query = `
      SELECT * FROM schedule
      WHERE date_start::date >= $1 OR date_end::date >= $2
      ORDER BY date_start ASC;
    `;
    const values = [today, today];

    const { rows } = await pgPool.query(query, values);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
