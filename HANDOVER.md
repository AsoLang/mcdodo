# Handover

## Current State (2026-02-27 — updated)

### Latest changes
- Added `CLAUDE.md` — codebase guidance for Claude Code
- Added `HANDOVER.md` — this file (gitignored)
- `components/Footer.tsx` — replaced Visa/Mastercard/Maestro/Amex text with SVG logos (Visa, Mastercard, PayPal, Apple Pay, Google Pay)
- Added "We Deliver With" section with Royal Mail + Evri SVG logos
- SVGs stored in `public/media/`
- Removed "We Deliver To" countries text

### What's working
- Admin panel fully secured with HMAC-SHA256 session tokens (all routes migrated)
- Shop price filter fixed (products over £100 now visible)
- Orders: delete works, pagination works, dashboard shows live data
- Hidden products show "Shop New Arrivals" banner
- Security headers in place (CSP, HSTS, X-Frame-Options)

### Known issues / tech debt
- No rate limiting on login or public APIs
- No Zod input validation on API routes
- Email templates contain unsanitised user data
- Discount codes are hardcoded (not in DB)
- No Neon connection pooling
- Stripe webhook replay attack protection missing
- Neon compute at ~80% CU-hours (fixed revalidate to 1hr, but no pooling yet)

### Environment variables required
Must be set in Vercel:
- `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_KEY`
- `RESEND_API_KEY`

### Next priorities
1. Rate limiting (login + public APIs)
2. Zod validation on API routes
3. Neon connection pooling
4. Sanitise email templates
