import { pgPool } from '@/utils/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const dataArray = await req.json(); // array of objects

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return NextResponse.json(
        { message: "No data provided" },
        { status: 400 }
      );
    }

    // Columns
    const columns = [
      "proid",
      "serial",
      "mac",
      "status_stock",
      "into_stock",
      "out_stock",
      "price",
      "brand",
      "model",
      "project",
      "purchase"
    ];

    // Generate VALUES placeholders:  ($1,$2,...), ($12,$13,...)
    const values = [];
    const placeholders = dataArray
      .map((item, index) => {
        const baseIndex = index * columns.length;

        values.push(
          item.proid,
          item.serial,
          item.mac,
          item.status_stock,
          item.into_stock,
          item.out_stock,
          item.price,
          item.brand,
          item.model,
          item.project,
          item.purchase
        );

        const rowPlaceholders = columns.map((_, i) => `$${baseIndex + i + 1}`);

        return `(${rowPlaceholders.join(",")})`;
      })
      .join(",");

    const query = `
      INSERT INTO equipment (${columns.join(",")})
      VALUES ${placeholders}
    `;

    await pgPool.query(query, values);

    return NextResponse.json(
      { message: "Data created successfully" },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error inserting data:", error);
    return NextResponse.json(
      { message: "Failed to insert data" },
      { status: 500 }
    );
  }
}
