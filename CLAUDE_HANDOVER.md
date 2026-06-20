# Mcdodo Handover

Current date: 2026-06-01

## What Changed

- Fixed admin product visibility controls on `/admin/products`.
  - Added `Visible`, `Hidden`, and `All` filters so hidden products can be found and restored.
  - Changed the eye button to call `PATCH /api/admin/products/[id]/visibility`.
  - Pushed commit `d30bcfb` (`Fix admin product visibility controls`).
- Fixed public shop cache after quick visibility toggles.
  - `app/api/admin/products/[id]/visibility/route.ts` now revalidates public product/listing routes after toggling visibility.
  - Revalidated paths include `/shop`, product detail page, `/archive`, `/categories`, `/shop/wireless-earphones`, shop/search APIs, and sitemap.
  - Pushed commit `ba79465` (`Revalidate shop after visibility toggle`).
- Drafted updated ChargeGuard product description copy with `<br>` spacing and a link to `https://www.mcdodo.co.uk/nop-landing.html`.
- Built a standalone landing page at `public/nop-landing.html`.
- Added a direct Stripe checkout route at `app/api/chargeguard-checkout/route.ts`.
- Wired the landing page buttons to create checkout sessions directly instead of routing through `/shop`.
- Added a mobile sticky purchase card on the landing page.
- Made feature cards and review cards swipeable on mobile.
- Added autoplay for the feature carousel when it scrolls into view.
- Removed product-page quantity bugs:
  - Add to Cart now respects selected quantity.
  - Apple Pay quick-buy now carries quantity through.
- Added cart stock reconciliation:
  - `contexts/CartContext.tsx` now has `updateItemStock()`.
  - `components/CartSidebar.tsx` updates stale quantities when checkout reports stock changes.
- Hardened checkout and fulfillment:
  - `app/api/checkout/route.ts` validates live stock before creating Stripe sessions.
  - `app/api/apple-pay-checkout/route.ts` validates live stock too.
  - `app/api/webhooks/stripe/route.ts` now guards the stock decrement against overselling.

## Current Landing Page State

- File: `public/nop-landing.html`
- Uses local assets from `public/media/nop/`
- Store branding remains `Mcdodo (UK)`
- Product copy no longer claims the product itself is a Mcdodo-branded product
- Mobile sticky bar now uses a single clear buy button
- Reviews section is a mobile swipe carousel
- Feature section is a mobile swipe carousel with 1.3s autoplay when visible

## Checkout Flow

1. User clicks a buy button on the landing page.
2. Browser posts to `POST /api/chargeguard-checkout`.
3. Server looks up the product in Neon by slug.
4. Server validates live stock.
5. Server creates a Stripe Checkout session.
6. Stripe redirects to `/success?session_id=...`.

## Important Files

- [public/nop-landing.html](./public/nop-landing.html)
- [app/api/chargeguard-checkout/route.ts](./app/api/chargeguard-checkout/route.ts)
- [app/admin/products/page.tsx](./app/admin/products/page.tsx)
- [app/api/admin/products/[id]/visibility/route.ts](./app/api/admin/products/[id]/visibility/route.ts)
- [app/api/checkout/route.ts](./app/api/checkout/route.ts)
- [app/api/apple-pay-checkout/route.ts](./app/api/apple-pay-checkout/route.ts)
- [app/api/webhooks/stripe/route.ts](./app/api/webhooks/stripe/route.ts)
- [components/ProductDetail.tsx](./components/ProductDetail.tsx)
- [components/ApplePayButton.tsx](./components/ApplePayButton.tsx)
- [components/CartSidebar.tsx](./components/CartSidebar.tsx)
- [contexts/CartContext.tsx](./contexts/CartContext.tsx)

## Blockers

- I could not pull Vercel env vars locally because the repo is not linked and the Vercel token in this workspace is invalid.
- There is no local `.env.local`, so `DATABASE_URL` is unavailable in this workspace.
- Because of that, I could not actually insert the new product into Neon from here.
- The direct checkout route currently assumes the product slug `chargeguard-kh-51`.

## What Is Still Left

- Add the new product and variant into Neon so it appears in `/shop`.
- Confirm the slug in Neon matches `chargeguard-kh-51` or update `app/api/chargeguard-checkout/route.ts`.
- After Vercel deploys `ba79465`, if a product was made visible before the fix and still does not show on `/shop`, toggle it hidden then visible once more to trigger fresh revalidation.
- Test the landing page checkout on a real mobile device.
- Decide whether the mobile sticky buy bar should remain a single-button action or show more purchase metadata.

## Useful Notes

- `/shop` is statically cached (`revalidate = 3600`), so admin visibility changes must explicitly call `revalidatePath`.
- The site already has a success page at `app/success/page.tsx`.
- The promo banner is hidden on `/success`.
- The cart and checkout flow now handle stale stock more gracefully than before.
- The landing page is standalone and does not depend on the main shop UI.
