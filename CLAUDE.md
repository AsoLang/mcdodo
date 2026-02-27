# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Build production bundle
npm run lint     # Run ESLint
```

No test suite configured.

## Architecture

**Next.js 16 App Router** — all routes live under `app/`. Path alias `@/*` maps to the repo root.

### Key conventions

- **API routes** follow `app/api/<resource>/route.ts` with named exports (`GET`, `POST`, etc.)
- **Admin routes** (`/admin/*`) are protected by middleware in `proxy.ts` — NOT `middleware.ts`. All admin API routes must call `verifySessionToken()` from `lib/session.ts` to check the `admin_auth` cookie. Never check `cookie === 'true'` (old pattern, fully migrated away).
- **Database** — use the `sql` tagged template from `lib/db.ts`. No ORM, raw SQL. Neon serverless PostgreSQL.
- **Revalidation** — shop/product pages use `export const revalidate = 3600`. Admin pages use `no-store`.
- **Tailwind v4** — configured via PostCSS (`@tailwindcss/postcss`), no `tailwind.config.*` file.

### Data flow

- Cart: `contexts/CartContext.tsx` → localStorage → `CartSidebar.tsx`
- Checkout: client → `app/api/checkout/route.ts` → Stripe → `app/api/webhooks/stripe/route.ts` → fulfillment
- Auth: `app/api/admin/login/route.ts` sets a signed cookie → `proxy.ts` verifies it on every `/admin` request
- Visitor tracking: `components/VisitorTracker.tsx` fires on 25% of page loads → `app/api/track-visit/route.ts` → `daily_stats` + `visitor_countries` tables

### Core files

| File | Purpose |
|------|---------|
| `proxy.ts` | Middleware — protects `/admin` routes |
| `lib/db.ts` | Neon DB client + `Product`/`ProductVariant` interfaces |
| `lib/session.ts` | HMAC-SHA256 session token (generate + verify) |
| `lib/email.ts` + `lib/email-templates.ts` | Resend email helpers |
| `contexts/CartContext.tsx` | Cart state (localStorage-backed) |
| `next.config.ts` | Security headers, image domains, redirects |
| `vercel.json` | Cron: `recompute-stock` runs daily at 3 AM |

### Required environment variables

```
DATABASE_URL              # Neon PostgreSQL
ADMIN_PASSWORD            # Admin login
ADMIN_SESSION_SECRET      # HMAC signing key (must be set in Vercel too)
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_KEY
RESEND_API_KEY
```

### Known tech debt

- No rate limiting on login or public APIs
- No input validation (Zod) on API routes
- Email templates contain unsanitised user data
- Discount codes are hardcoded (not in DB)
- No Neon connection pooling
- Stripe webhook replay attack protection missing
