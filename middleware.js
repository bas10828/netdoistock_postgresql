import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'change-this-secret-in-production');

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // อนุญาต login/logout ผ่านได้โดยไม่ต้องมี token
  if (pathname === '/api/login' || pathname === '/api/logout') {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/?logout=1', request.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/?logout=1', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: ['/home/:path*', '/api/:path*'],
};
