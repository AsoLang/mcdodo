// Path: app/api/admin/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin_auth');
  if (adminAuth?.value === 'true') {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // 1. Get the password from Environment Variables
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('❌ ADMIN_PASSWORD is not set in environment variables!');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // 2. Strict Check
    if (password === adminPassword) {
      const cookieStore = await cookies();
      
      // We use 'admin_auth' as the cookie name. 
      // We will fix the logout route to match this.
      cookieStore.set('admin_auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}