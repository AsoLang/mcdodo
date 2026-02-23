// lib/session.ts
// HMAC-SHA256 signed session tokens using the Web Crypto API.
// Compatible with both Node.js (18+) and Next.js Edge Runtime.

const SEPARATOR = '.';

function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToUint8Array(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0) return new Uint8Array(new ArrayBuffer(0));
  const arr = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

async function importKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

/** Generate a cryptographically signed session token. */
export async function generateSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');

  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const random = uint8ArrayToHex(randomBytes);

  const key = await importKey(secret, 'sign');
  const rawSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(random));

  return `${random}${SEPARATOR}${uint8ArrayToHex(new Uint8Array(rawSig))}`;
}

/** Verify a session token. Returns true only if the HMAC signature is valid. */
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret || !token) return false;

    const separatorIndex = token.indexOf(SEPARATOR);
    if (separatorIndex === -1) return false;

    const random = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + SEPARATOR.length);
    if (!random || !signature) return false;

    const key = await importKey(secret, 'verify');
    return await crypto.subtle.verify(
      'HMAC',
      key,
      hexToUint8Array(signature),
      new TextEncoder().encode(random)
    );
  } catch {
    return false;
  }
}
