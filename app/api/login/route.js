import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/utils/db'; // ใช้ PostgreSQL query wrapper

export async function POST(request) {
  try {
    const { loginIdentifier, password } = await request.json();

    // PostgreSQL ใช้ placeholder $1, $2 แทน ?
    const queryText = 'SELECT * FROM users WHERE username = $1 OR email = $2';
    const rows = await query(queryText, [loginIdentifier, loginIdentifier]);

    if (rows.length > 0) {
      const user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        return NextResponse.json({ message: 'Login successful', user });
      } else {
        return NextResponse.json({ message: 'Invalid login credentials' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ message: 'Invalid login credentials' }, { status: 401 });
    }
  } catch (err) {
    console.error('Error during login:', err);
    return NextResponse.json({ error: 'Error during login' }, { status: 500 });
  }
}
