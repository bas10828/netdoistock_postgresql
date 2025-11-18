import { pgPool } from '@/utils/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, email, password, priority } = body;

    // ตรวจสอบค่าที่จำเป็น
    if (!username || !email || !password || !priority) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password.toString(), 10);

    // PostgreSQL ใช้ $1, $2, ... แทน ?
    const query = `
      INSERT INTO users (username, email, password, priority)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, priority
    `;
    const values = [username, email, hashedPassword, priority];

    const { rows } = await pgPool.query(query, values);

    // ส่งข้อมูลผู้ใช้ที่เพิ่มใหม่กลับไป
    return NextResponse.json({ message: 'User registered successfully', user: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Error registering user' }, { status: 500 });
  }
}
