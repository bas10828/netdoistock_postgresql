import { pgPool } from '@/utils/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, username, email, password, priority } = body;

    // ตรวจสอบค่าที่จำเป็น
    if (!id || !username || !email || !priority) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    let query, values;

    if (password) {
      // เข้ารหัสรหัสผ่านถ้ามีการเปลี่ยน
      const hashedPassword = await bcrypt.hash(password.toString(), 10);
      query = `
        UPDATE users
        SET username = $1, email = $2, password = $3, priority = $4
        WHERE id = $5
        RETURNING id, username, email, priority
      `;
      values = [username, email, hashedPassword, priority, id];
    } else {
      query = `
        UPDATE users
        SET username = $1, email = $2, priority = $3
        WHERE id = $4
        RETURNING id, username, email, priority
      `;
      values = [username, email, priority, id];
    }

    const { rows } = await pgPool.query(query, values);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'No user updated' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully', user: rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}
