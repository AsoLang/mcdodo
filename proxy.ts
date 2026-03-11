// Path: middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/session';

// We use 'export default' here to fix the Next.js export error
export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Define Protected Routes
  // Any path that starts with /admin (BUT NOT the login page itself)
  const isAdminRoute = path.startsWith('/admin');
  const isLoginPage = path === '/admin';

  // 2. Check for the Auth Cookie and verify the HMAC-signed token
  const authCookie = request.cookies.get('admin_auth');
  const isAuthenticated = authCookie?.value
    ? await verifySessionToken(authCookie.value)
    : false;

  // 3. Logic:
  // If user is trying to access dashboard/orders/etc. AND is NOT logged in...
  if (isAdminRoute && !isLoginPage && !isAuthenticated) {
    // ...redirect them to the login page.
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};