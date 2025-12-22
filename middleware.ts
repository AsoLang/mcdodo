// Path: middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// We use 'export default' here to fix the Next.js export error
export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Define Protected Routes
  // Any path that starts with /admin (BUT NOT the login page itself)
  const isAdminRoute = path.startsWith('/admin');
  const isLoginPage = path === '/admin'; 

  // 2. Check for the Auth Cookie
  const authCookie = request.cookies.get('admin_auth');
  const isAuthenticated = authCookie?.value === 'true';

  // 3. Logic:
  // If user is trying to access dashboard/orders/etc. AND is NOT logged in...
  if (isAdminRoute && !isLoginPage && !isAuthenticated) {
    // ...redirect them to the login page.
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Allow the request to continue
  return NextResponse.next();
}

// Configuration: Only run this middleware on admin paths
export const config = {
  matcher: '/admin/:path*',
};