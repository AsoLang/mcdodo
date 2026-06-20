export function isCronRequestAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authorization = request.headers.get('authorization');
  const legacyHeader = request.headers.get('x-cron-secret');

  return authorization === `Bearer ${secret}` || legacyHeader === secret;
}
