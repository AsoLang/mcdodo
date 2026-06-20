import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';
import { verifySessionToken } from '@/lib/session';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

async function hasValidImageSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const startsWith = (...signature: number[]) =>
    signature.every((byte, index) => bytes[index] === byte);

  if (file.type === 'image/jpeg') return startsWith(0xff, 0xd8, 0xff);
  if (file.type === 'image/png') {
    return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  }
  if (file.type === 'image/gif') {
    const header = new TextDecoder().decode(bytes.slice(0, 6));
    return header === 'GIF87a' || header === 'GIF89a';
  }
  if (file.type === 'image/webp') {
    return (
      new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
      new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
    );
  }
  return false;
}

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_auth');
  return session ? await verifySessionToken(session.value) : false;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `A maximum of ${MAX_FILES} files can be uploaded at once` },
        { status: 400 }
      );
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const invalidFile = files.find(
      (file) =>
        !ALLOWED_IMAGE_TYPES.has(file.type) ||
        file.size <= 0 ||
        file.size > MAX_FILE_SIZE
    );
    const signaturesAreValid = (
      await Promise.all(files.map(hasValidImageSignature))
    ).every(Boolean);

    if (invalidFile || !signaturesAreValid || totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          error:
            'Only JPEG, PNG, WebP, or GIF images up to 5 MB each and 20 MB total are allowed',
        },
        { status: 400 }
      );
    }

    console.log(`Uploading ${files.length} files...`);

    const uploadPromises = files.map(async (file) => {
      const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .slice(-120);
      const blob = await put(`products/${safeName || 'image'}`, file, {
        access: 'public',
        addRandomSuffix: true,
        contentType: file.type,
        cacheControlMaxAge: 31536000,
      });
      console.log(`Uploaded: ${blob.url}`);
      return blob.url;
    });

    const urls = await Promise.all(uploadPromises);

    console.log('All uploads complete:', urls);

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}
