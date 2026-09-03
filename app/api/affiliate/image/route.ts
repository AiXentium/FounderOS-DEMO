import { NextResponse } from 'next/server';

const allowedHosts = new Set(['media-cdn.tripadvisor.com', 'images.via.placeholder.com']);

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('url');
  if (!raw) return new NextResponse('url is required', { status: 400 });
  let target: URL;
  try { target = new URL(raw); } catch { return new NextResponse('invalid image URL', { status: 400 }); }
  if (target.protocol !== 'https:' || !allowedHosts.has(target.hostname)) return new NextResponse('image host not allowed', { status: 400 });
  const response = await fetch(target, { signal: AbortSignal.timeout(10_000), headers: { accept: 'image/avif,image/webp,image/*' } }).catch(() => null);
  if (!response?.ok) return new NextResponse('image unavailable', { status: 404 });
  const type = response.headers.get('content-type') ?? 'image/jpeg';
  if (!type.startsWith('image/')) return new NextResponse('not an image', { status: 415 });
  return new NextResponse(await response.arrayBuffer(), { headers: { 'content-type': type, 'cache-control': 'public, max-age=86400' } });
}
