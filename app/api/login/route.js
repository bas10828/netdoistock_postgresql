import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/utils/db';
import { signToken } from '@/utils/auth';

// Rate limiter — 10 ครั้ง / 15 นาที ต่อ IP (reset เมื่อ server restart)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }

  record.count++;
  return { limited: false };
}

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request) {
  const ip = getClientIp(request);
  const { limited, retryAfter } = checkRateLimit(ip);

  if (limited) {
    return NextResponse.json(
      { message: `Too many login attempts. Try again in ${retryAfter} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const { loginIdentifier, password } = await request.json();

    const queryText = 'SELECT * FROM users WHERE username = $1 OR email = $2';
    const rows = await query(queryText, [loginIdentifier, loginIdentifier]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Invalid login credentials' }, { status: 401 });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid login credentials' }, { status: 401 });
    }

    // login สำเร็จ — ล้าง counter ของ IP นี้
    loginAttempts.delete(ip);

    const token = await signToken({
      id: user.id,
      username: user.username,
      email: user.email,
      priority: user.priority,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        username: user.username,
        email: user.email,
        priority: user.priority,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 ชั่วโมง
    });

    return response;
  } catch (err) {
    console.error('Error during login:', err);
    return NextResponse.json({ error: 'Error during login' }, { status: 500 });
  }
}
