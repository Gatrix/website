import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    if (!path || path.length < 2) {
      return new NextResponse('Invalid path', { status: 400 });
    }

    const bucket = path[0];
    const filename = path.slice(1).join('/');
    
    const PROJECT_ID = 'uuhuugprmmdobmpkbjnn';
    const supabaseUrl = `https://${PROJECT_ID}.supabase.co/storage/v1/object/public/${bucket}/${filename}`;

    const response = await fetch(supabaseUrl);
    
    if (!response.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
