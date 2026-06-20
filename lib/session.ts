// HMAC-SHA256 signed, time-limited admin session tokens.
// Compatible with both Node.js and the Next.js Edge Runtime.

const SEPARATOR = '.';
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const HEX_32_BYTES = /^[0-9a-f]{64}$/;

function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToUint8Array(hex: string): Uint8Array<ArrayBuffer> {
  if (!HEX_32_BYTES.test(hex)) {
    return new Uint8Array(new ArrayBuffer(0));
  }

  const arr = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let index = 0; index < hex.length; index += 2) {
    arr[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
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

export async function generateSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters');
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const random = uint8ArrayToHex(crypto.getRandomValues(new Uint8Array(32)));
  const payload = `${expiresAt}${SEPARATOR}${random}`;
  const key = await importKey(secret, 'sign');
  const rawSignature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  );

  return `${payload}${SEPARATOR}${uint8ArrayToHex(new Uint8Array(rawSignature))}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret || secret.length < 32 || !token) return false;

    const parts = token.split(SEPARATOR);
    if (parts.length !== 3) return false;

    const [expiresAtValue, random, signature] = parts;
    const expiresAt = Number(expiresAtValue);
    const now = Math.floor(Date.now() / 1000);

    if (
      !Number.isInteger(expiresAt) ||
      expiresAt <= now ||
      expiresAt > now + SESSION_TTL_SECONDS ||
      !HEX_32_BYTES.test(random) ||
      !HEX_32_BYTES.test(signature)
    ) {
      return false;
    }

    const key = await importKey(secret, 'verify');
    return crypto.subtle.verify(
      'HMAC',
      key,
      hexToUint8Array(signature),
      new TextEncoder().encode(`${expiresAtValue}${SEPARATOR}${random}`)
    );
  } catch {
    return false;
  }
}

export { SESSION_TTL_SECONDS };
