const PRODUCTION_FALLBACK_URL = 'https://www.mcdodo.co.uk';
const DEVELOPMENT_FALLBACK_URL = 'http://localhost:3000';

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const fallback =
    process.env.NODE_ENV === 'production'
      ? PRODUCTION_FALLBACK_URL
      : DEVELOPMENT_FALLBACK_URL;

  try {
    const url = new URL(configured || fallback);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported site URL protocol');
    }
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      throw new Error('Production site URL must use HTTPS');
    }
    return url.origin;
  } catch {
    return fallback;
  }
}
