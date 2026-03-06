# Mcdodo UK — Handover Document

_Last updated: 2026-03-06 (Session 8)_

---

## Project Overview

- **Framework:** Next.js 16 + React 19 + TypeScript + Tailwind v4
- **Hosting:** Vercel
- **Database:** Neon (PostgreSQL via `@neondatabase/serverless`)
- **Payments:** Stripe
- **Emails:** Resend
- **Blob storage:** Vercel Blob
- **Tracking:** ipapi.co for geolocation (Plerdy removed)
- **Admin panel:** `/admin` — protected by HMAC-SHA256 signed cookie

---

## Environment Variables

Must be set in Vercel:

```
DATABASE_URL              # Neon PostgreSQL connection string
ADMIN_PASSWORD            # Admin login password
ADMIN_SESSION_SECRET      # HMAC signing key
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_KEY
RESEND_API_KEY
```

---

## Architecture

### Routing
- All routes under `app/`. Path alias `@/*` maps to repo root.
- API routes: `app/api/<resource>/route.ts` with named exports (`GET`, `POST`, etc.)
- Admin routes (`/admin/*`) protected by middleware in `proxy.ts`

### Key Files

| File | Purpose |
|------|---------|
| `proxy.ts` | Middleware — protects all `/admin` routes |
| `lib/db.ts` | Neon DB client + `Product`/`ProductVariant` interfaces |
| `lib/session.ts` | HMAC-SHA256 session token (generate + verify), edge-compatible |
| `lib/email.ts` + `lib/email-templates.ts` | Resend email helpers |
| `contexts/CartContext.tsx` | Cart state — stored in localStorage |
| `next.config.ts` | Security headers, image domains, redirects |
| `vercel.json` | Cron: `recompute-stock` runs daily at 3 AM |
| `components/VisitorTracker.tsx` | Fires DB write on 25% of page loads |
| `app/api/track-visit/route.ts` | Writes to `daily_stats` + `visitor_countries` tables |
| `components/ProductQuickView.tsx` | Quick-view modal (fetches product + variants by slug) |
| `app/api/products/[slug]/route.ts` | Returns product + all variants by slug (used by quick view) |

### Data Flow
- **Cart:** `CartContext.tsx` → localStorage → `CartSidebar.tsx`
- **Checkout:** client → `app/api/checkout/route.ts` → Stripe → `app/api/webhooks/stripe/route.ts` → fulfillment
- **Auth:** `app/api/admin/login/route.ts` sets signed cookie → `proxy.ts` verifies on every `/admin` request
- **Visitor tracking:** `VisitorTracker.tsx` fires on 25% of page loads → `app/api/track-visit/route.ts`

### Auth Pattern
All admin API routes must call `verifySessionToken()` from `lib/session.ts`.

**Never** check `cookie === 'true'` — that is the old pattern, fully migrated away.

```ts
import { verifySessionToken } from '@/lib/session';

const adminAuth = cookies().get('admin_auth');
const valid = await verifySessionToken(adminAuth?.value ?? '');
if (!valid) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
```

### Caching
- Shop/product pages: `export const revalidate = 3600`
- Admin pages: `no-store`

### Tailwind v4
No `tailwind.config.*` file — configured via PostCSS (`@tailwindcss/postcss`).

---

## Work History

### Session 1 (2026-02-23) — Security Fixes
Security audit found 36 issues (1 Critical, 11 High, 17 Medium, 7 Low).

**Fixed:**
1. `next.config.ts` — Added CSP, X-Frame-Options (DENY), X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS
2. `lib/session.ts` — Created HMAC-SHA256 signed session token utility (new file)
3. `app/api/admin/login/route.ts` — Replaced forgeable `'true'` cookie with signed token; session 24h → 8h
4. `proxy.ts` — Now async; verifies HMAC token instead of `=== 'true'`

**Neon compute:** Was at 80% (80.1 / 100 CU-hours). Fixed by bumping `revalidate` from 300 → 3600 across all 7 shop/product pages.

---

### Session 2 (2026-02-25) — Admin Auth Bug Fix
After Session 1, login worked but all admin API calls returned 401.

**Root causes:**
1. `ADMIN_SESSION_SECRET` not added to Vercel → login route threw 500
2. Individual admin API routes still used old `isAuthenticated()` checking `=== 'true'`

**Fixed:**
- User added `ADMIN_SESSION_SECRET` to Vercel
- Migrated to `verifySessionToken()` in: `dashboard`, `visitor-countries`, `customers`, `campaigns`, `orders`, `orders/[id]/dispatch`, `orders/[id]/shipping`, `products/new`, `products/[id]/visibility`, `products/[id]/featured`, `royal-mail-export`, `send-email`

---

### Session 3 (2026-02-25) — Admin Products 401 Fix
`/admin/products` still redirected to login — more missed routes.

**Fixed** 5 more routes:
- `products/route.ts` (GET + PUT)
- `products/[id]/route.ts` (GET + PUT + DELETE)
- `products/reorder/route.ts`
- `upload/route.ts`
- `recompute-stock/route.ts`

All admin API routes now on HMAC token verification.

---

### Session 4 (2026-02-26) — Shop Bugs + UX

**Bug: Products priced > £100 invisible in shop**
- `ShopPage.tsx` had `priceRange = [0, 100]` default; "£50+" filter had upper bound of 100
- Fixed: default, reset, and "£50+" upper bound changed to `10000` in `components/ShopPage.tsx`

**Bug: Order delete returning 401**
- `app/api/admin/orders/[id]/route.ts` DELETE handler still had `=== 'true'` check
- Fixed: updated to `verifySessionToken()`

**Bug: Old migrated orders fail to delete (FK constraint)**
- FK `order_items_order_id_fkey` prevented deletion
- Fixed: DELETE route removes from `order_items` first, then `orders`

**Bug: Dashboard showing stale data**
- Dashboard API had `s-maxage=60, stale-while-revalidate=300`
- Fixed: changed to `no-store` in `app/api/admin/dashboard/route.ts`

**Bug: Orders pagination Previous/Next not working**
- `currentPage` was in the reset `useEffect` dependency array in `app/admin/orders/page.tsx`
- Fixed: removed `currentPage` from that dependency array

**Feature: "Shop New Arrivals" banner on hidden product pages**
- Hidden products show a banner linking to `/shop` above Add to Cart
- Added `visible?` to `Product` interface in `lib/db.ts` + banner in `components/ProductDetail.tsx`

---

### Session 5 (2026-02-27) — Footer, Quick View, Product Card

**Feature: Footer payment/delivery logos**
- Replaced text payment methods (Visa/Mastercard/Maestro/Amex) with SVG logos
- Payment logos: Visa, Mastercard, PayPal, Apple Pay, Google Pay
- Added "We Deliver With" section: Royal Mail + Evri SVGs
- Removed "We Deliver To" countries text
- SVGs stored in `public/media/`
- Changes: `components/Footer.tsx`

**Feature: Quick view modal on shop/product cards**
- Replaced full-width "Add to Basket" button on `ShopPage.tsx` (was adding random variant)
- Now shows a small orange basket icon (bottom-right of product image) — always visible
- Clicking opens `ProductQuickView.tsx` modal: fetches product + variants, shows image/title/description/price/variant selector/add to basket; closes on X, backdrop, or Escape
- New API route: `app/api/products/[slug]/route.ts` — returns product + all variants by slug
- Also updated `components/ProductCard.tsx` (used on homepage featured section) with same basket icon + modal

---

### Session 6 (2026-03-06) — Performance & Bot Blocking

**Vercel image transformations at 92% (4.6K/5K) in 6 days**
- Root cause: Next.js `<Image>` generates a new transformation for every unique size/format/device — bots were hitting the site and exhausting the quota
- Fixed: `next.config.ts` — added `unoptimized: true` to images config. Next.js now serves images as-is, zero transformations generated going forward

**Geo-blocking non-UK traffic**
- Traffic data showed SG (26%) and US (18%) visitors with zero business value, likely bots/crawlers
- Fixed: `proxy.ts` middleware now checks `request.geo?.country` — only GB passes through, all other known countries get 403. Unknown country (no geo data) is allowed through to avoid blocking VPN users
- Middleware matcher updated to run on all routes (not just `/admin`)

**Performance: Vercel Speed Insights showing "Needs Improvement" (50-90) on `/categories`**
- Root cause: `framer-motion` (~70KB gzipped) loaded for simple fade/slide animations
- Fixed: `components/CategoriesPageClient.tsx` — removed framer-motion entirely, replaced with native `IntersectionObserver` hook + CSS transitions (`transition-all`, `opacity`, `translate-y`)
- Also added `priority` prop to first 4 product images on the page

**Performance: INP 2048ms on `/shop/p/[slug]`, 4056ms on `/admin/products/[id]`**
- Root cause: framer-motion blocking the main thread on every interaction (variant switch, accordion open, gallery modal)
- Fixed across all high-traffic files by replacing every `motion.*` / `AnimatePresence` with plain HTML + CSS transitions:
  - `components/ProductDetail.tsx` — main image wrapper, accordion expand, gallery modal
  - `components/CartSidebar.tsx` — slide-in panel (CSS `translate-x`), backdrop fade, shipping bar, cart items, discount accordion
  - `components/ShopPage.tsx` — hero sections, best seller cards, product grid, features section, FAQ accordion
  - `app/admin/orders/page.tsx` — expanded order row, dispatch modal
  - `app/admin/products/page.tsx` — sortable product card wrapper

**framer-motion still present in 12 files (lower priority):**
`ProductCard`, `CategoryGrid`, `Newsletter`, `SearchModal`, `Navbar`, `Hero`, `success/page`, `contact/page`, `checkout/cancel/page`, `about/page`, `WhyChooseUs`, `TrustBadges`

**Plerdy removed**
- Plerdy script was using `eval()` which violated CSP and threw console errors
- Removed entire `<Script>` block from `app/layout.tsx`, removed `next/script` import
- Cleaned CSP in `next.config.ts`: removed Plerdy domains from `script-src` and `connect-src`, removed `unsafe-eval`

**Promo banner**
- Orange banner displayed below the navbar, showing 3 items (truck / rocket / basket icons + editable text)
- Admin can toggle on/off, edit text per item, change background colour via hex code
- New files:
  - `components/PromoBanner.tsx` — client component, fetches `/api/promo-banner` on mount, renders `fixed top-16 md:top-20 z-40` + `h-10` spacer div
  - `app/api/promo-banner/route.ts` — public GET, reads `site_settings` where key = `promo_banner`, `Cache-Control: no-store`
  - `app/api/admin/settings/route.ts` — protected GET + PUT, upserts `site_settings` JSONB
  - `app/admin/settings/page.tsx` — toggle, colour hex input, 3 text inputs, live preview, save button
- DB table required:
  ```sql
  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  INSERT INTO site_settings (key, value)
  VALUES ('promo_banner', '{"enabled": true, "color": "#f97316", "items": [{"icon": "truck", "text": "Free freight over £39"}, {"icon": "rocket", "text": "Price Match Guarantee!"}, {"icon": "basket", "text": "100 days right of withdrawal"}]}')
  ON CONFLICT (key) DO NOTHING;
  ```
- SVG icons: `/media/svg/truck.svg`, `/media/svg/rcoket.svg` (typo in filename — keep as-is), `/media/svg/basketicon.svg`
- Icons rendered with `brightness-0 invert` CSS filter to appear white on any background colour
- Banner colour is stored as a hex string in the DB; applied via inline `style` (not Tailwind class) since Tailwind can't resolve dynamic values

---

### Session 7 (2026-03-06) — Promo Banner, Plerdy Removal, Accessibility Fixes, Banner Colour

**Promo banner** — see Session 6 details above (built and shipped in session 6, documented here with fixes applied in session 7)

**Accessibility fixes (Chrome console warnings)**
Fixed "A form field element should have an id or name attribute" and "No label associated with a form field" warnings across:
- `app/contact/page.tsx` — added `id` + `name` to all 4 inputs (name, email, orderNumber, message); added `htmlFor` to all 4 labels
- `components/CartSidebar.tsx` — added `htmlFor="discount-code"` to label, `id="discount-code" name="discountCode"` to mobile input, `name="discountCode"` to desktop input
- `app/admin/settings/page.tsx` — added `htmlFor={banner-text-${i}}` to labels, `id` + `name` to each banner text input

**Banner colour picker**
- Added `color` field to `BannerSettings` interface in both `PromoBanner.tsx` and `admin/settings/page.tsx`
- Admin settings page now shows a hex input with a live colour swatch preview
- `PromoBanner.tsx` applies colour via `style={{ backgroundColor: settings.color || '#f97316' }}`
- To add the colour field to existing DB rows, run:
  ```sql
  UPDATE site_settings SET value = value || '{"color": "#f97316"}' WHERE key = 'promo_banner' AND value->>'color' IS NULL;
  ```
  Or just open Admin → Settings and save — the PUT endpoint writes the full object including colour

---

### Session 8 (2026-03-06) — Buy Now merges cart

**Feature: Buy Now includes existing cart items**
- Previously "Buy Now" opened a Stripe session for only the clicked product, ignoring anything already in the cart
- Fixed: `components/ProductDetail.tsx` — `handleBuyNow` now reads `cartItems` from `useCart`, merges them with the Buy Now product into one Stripe payload
- If the same variant is already in the cart, quantities are combined (cart qty + Buy Now qty)
- Shipping threshold (`>= £20`) recalculated across the full combined order
- No API changes — `/api/checkout` already accepted an array of items

---

## Current State (as of 2026-03-06)

### What's working
- Admin panel fully secured (HMAC-SHA256, all routes migrated)
- Security headers in place (CSP, HSTS, X-Frame-Options, etc.)
- Shop price filter fixed (products over £100 now visible)
- Orders: delete works, pagination works, dashboard shows live data
- Hidden products show "Shop New Arrivals" banner
- Footer has SVG payment/delivery logos
- Quick view modal on shop + homepage product cards
- Image transformations stopped (`unoptimized: true`)
- Non-UK traffic blocked at middleware level (GB only)
- framer-motion removed from all critical pages (INP fix)
- Plerdy removed; CSP cleaned (`unsafe-eval` gone)
- Promo banner: live on site, admin-controlled (toggle, text, colour)
- Form accessibility warnings resolved (contact page, cart sidebar, admin settings)
- Buy Now includes existing cart items in the Stripe checkout session

### Outstanding Tech Debt (priority order)
1. **Rate limiting** — no rate limiting on login or any public API
2. **Input validation** — no Zod validation on any API route
3. **Email XSS** — email templates contain unsanitised user data
4. **Discount codes** — hardcoded in source, not in DB
5. **Stripe webhook replay protection** — no timestamp validation
6. **Neon connection pooling** — not configured (contributes to compute usage)

---

## Tips & Gotchas

- If a new admin route returns 401, check it calls `verifySessionToken()` — easy to forget
- Search for `adminAuth.value !== 'true'` if 401s appear unexpectedly
- `proxy.ts` is the actual middleware file (not `middleware.ts`)
- Visitor tracking runs on 25% of page loads — keep in mind for Neon compute budget
- Neon compute is billed monthly; revalidate = 3600 on shop pages helps keep it down
