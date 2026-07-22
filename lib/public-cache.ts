import { revalidatePath } from 'next/cache';

const PRODUCT_LISTING_PATHS = [
  '/',
  '/shop',
  '/archive',
  '/categories',
  '/reviews',
  '/shop/wireless-earphones',
  '/api/shop/products',
  '/api/products/search',
  '/api/archived-products',
  '/sitemap.xml',
];

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    // Cache refresh must never break checkout, webhooks, or admin writes.
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[Cache] Failed to revalidate ${path}:`, error);
    }
  }
}

export function revalidateProductContent(
  slugs: Array<string | null | undefined> = []
) {
  for (const path of PRODUCT_LISTING_PATHS) safeRevalidatePath(path);

  for (const slug of new Set(slugs.filter(Boolean))) {
    safeRevalidatePath(`/shop/p/${slug}`);
    safeRevalidatePath(`/api/products/${slug}`);
  }
}

export function revalidateBlogContent(slug?: string | null) {
  safeRevalidatePath('/blog');
  safeRevalidatePath('/blog/rss.xml');
  safeRevalidatePath('/sitemap.xml');

  if (slug) {
    safeRevalidatePath(`/blog/${slug}`);
    safeRevalidatePath(`/api/blog/post/${slug}`);
  }
}
