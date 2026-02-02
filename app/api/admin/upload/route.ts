import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_auth');
  return session?.value === 'true';
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

    console.log(`Uploading ${files.length} files...`);

    const uploadPromises = files.map(async (file) => {
      const blob = await put(file.name, file, {
        access: 'public',
        addRandomSuffix: true,
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
      { error: 'Failed to upload images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
