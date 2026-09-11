import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;

  // 1. Redirect unauthenticated users attempting to access protected routes
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/parent'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Redirect PARENT users from root /dashboard to their dedicated portal
  if (pathname === '/dashboard' && role === 'PARENT') {
    return NextResponse.redirect(new URL('/parent/dashboard', request.url));
  }

  // 3. Protect Parent Portal routes (Parent or Admin only)
  if (pathname.startsWith('/parent') && role !== 'PARENT' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 4. Protect Teacher management routes (Teacher or Admin only)
  if (pathname.startsWith('/dashboard/teacher') && role !== 'TEACHER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. Protect Admin routes (Admin only)
  if (pathname.startsWith('/dashboard/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/parent/:path*'],
};