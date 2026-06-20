import { createHash, timingSafeEqual } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  generateSessionToken,
  SESSION_TTL_SECONDS,
  verifySessionToken,
} from '@/lib/session';

export const runtime = 'nodejs';

const sql = neon(process.env.DATABASE_URL!);
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

function clientIdentifier(request: NextRequest): string {
  const ip = (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  ).slice(0, 128);
  return createHash('sha256').update(ip).digest('hex');
}

async function ensureRateLimitTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      identifier TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      locked_until TIMESTAMPTZ
    )
  `;
}

async function isRateLimited(identifier: string): Promise<boolean> {
  const rows = await sql`
    SELECT locked_until
    FROM admin_login_attempts
    WHERE identifier = ${identifier}
      AND locked_until IS NOT NULL
      AND locked_until > NOW()
    LIMIT 1
  `;
  return rows.length > 0;
}

async function recordFailedAttempt(identifier: string): Promise<boolean> {
  const rows = await sql`
    INSERT INTO admin_login_attempts (
      identifier,
      attempts,
      window_started_at,
      locked_until
    )
    VALUES (${identifier}, 1, NOW(), NULL)
    ON CONFLICT (identifier) DO UPDATE SET
      attempts = CASE
        WHEN admin_login_attempts.window_started_at < NOW() - (${WINDOW_MINUTES} * INTERVAL '1 minute')
          THEN 1
        ELSE admin_login_attempts.attempts + 1
      END,
      window_started_at = CASE
        WHEN admin_login_attempts.window_started_at < NOW() - (${WINDOW_MINUTES} * INTERVAL '1 minute')
          THEN NOW()
        ELSE admin_login_attempts.window_started_at
      END,
      locked_until = CASE
        WHEN (
          CASE
            WHEN admin_login_attempts.window_started_at < NOW() - (${WINDOW_MINUTES} * INTERVAL '1 minute')
              THEN 1
            ELSE admin_login_attempts.attempts + 1
          END
        ) >= ${MAX_ATTEMPTS}
          THEN NOW() + (${WINDOW_MINUTES} * INTERVAL '1 minute')
        ELSE NULL
      END
    RETURNING locked_until
  `;

  return Boolean(rows[0]?.locked_until);
}

async function passwordMatches(password: unknown): Promise<boolean> {
  if (typeof password !== 'string' || password.length > 1024) return false;

  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (configuredHash) {
    return bcrypt.compare(password, configuredHash);
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    throw new Error('Admin password is not configured');
  }

  const supplied = createHash('sha256').update(password).digest();
  const expected = createHash('sha256').update(configuredPassword).digest();
  return timingSafeEqual(supplied, expected);
}

export async function GET() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin_auth');
  if (adminAuth?.value && await verifySessionToken(adminAuth.value)) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    await ensureRateLimitTable();
    const identifier = clientIdentifier(request);

    if (await isRateLimited(identifier)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(WINDOW_MINUTES * 60) },
        }
      );
    }

    const body = await request.json();
    if (!(await passwordMatches(body?.password))) {
      const locked = await recordFailedAttempt(identifier);
      return NextResponse.json(
        {
          error: locked
            ? 'Too many login attempts. Try again later.'
            : 'Invalid password',
        },
        {
          status: locked ? 429 : 401,
          ...(locked
            ? { headers: { 'Retry-After': String(WINDOW_MINUTES * 60) } }
            : {}),
        }
      );
    }

    await sql`
      DELETE FROM admin_login_attempts
      WHERE identifier = ${identifier}
    `;

    const token = await generateSessionToken();
    const cookieStore = await cookies();
    cookieStore.set('admin_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_TTL_SECONDS,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Login] Failed:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
