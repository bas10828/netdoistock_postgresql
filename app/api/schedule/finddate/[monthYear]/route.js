import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";
import moment from "moment-timezone";

export async function GET(req, { params }) {
  const { monthYear } = params;
  console.log("monthYear:", monthYear);

  // Validate monthYear format (YYYY-MM)
  if (!moment(monthYear, 'YYYY-MM', true).isValid()) {
    return NextResponse.json({ error: 'Invalid monthYear format. Use YYYY-MM' }, { status: 400 });
  }

  // Construct start and end dates for the specified monthYear
  const startDate = moment(monthYear, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
  const endDate = moment(monthYear, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');

  try {
    const query = `
      SELECT * FROM schedule
      WHERE date_start::date >= $1 AND date_end::date <= $2
      ORDER BY date_start ASC
    `;
    const values = [startDate, endDate];

    const { rows } = await pgPool.query(query, values);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
