import { NextResponse } from "next/server";
import { pgPool } from "@/utils/db";

// GET - Fetch all records
export async function GET(request) {
  const loggedIn = request.headers.get('loggedIn');
  if (!loggedIn || loggedIn !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { rows } = await pgPool.query('SELECT * FROM library');
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error executing query" }, { status: 500 });
  }
}

// POST - Create a new record
export async function POST(request) {
  const loggedIn = request.headers.get('loggedIn');
  if (!loggedIn || loggedIn !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { model, device_type, detail } = await request.json();
  if (!model || !device_type || !detail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const query = 'INSERT INTO library (model, device_type, detail) VALUES ($1, $2, $3) RETURNING *';
    const { rows } = await pgPool.query(query, [model, device_type, detail]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error inserting data" }, { status: 500 });
  }
}

// PUT - Update a record
export async function PUT(request) {
  const loggedIn = request.headers.get('loggedIn');
  if (!loggedIn || loggedIn !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, model, device_type, detail } = await request.json();
  if (!id || !model || !device_type || !detail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const query = 'UPDATE library SET model = $1, device_type = $2, detail = $3 WHERE id = $4 RETURNING *';
    const { rows } = await pgPool.query(query, [model, device_type, detail, id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error updating data" }, { status: 500 });
  }
}

// DELETE - Delete a record
export async function DELETE(request) {
  const loggedIn = request.headers.get('loggedIn');
  if (!loggedIn || loggedIn !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const query = 'DELETE FROM library WHERE id = $1 RETURNING *';
    const { rows } = await pgPool.query(query, [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Record deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error deleting data" }, { status: 500 });
  }
}
