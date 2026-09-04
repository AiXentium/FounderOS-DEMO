import { NextResponse } from 'next/server';
import { zernioAccountConnectUrl } from '@/lib/connectors/zernio';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  if (platform !== 'instagram' && platform !== 'facebook') {
    return NextResponse.json({ ok: false, error: 'Only Instagram and Facebook OAuth are supported here.' }, { status: 400 });
  }
  try {
    const returnUrl = new URL('/social?social=connected', _request.url);
    returnUrl.searchParams.set('platform', platform);
    const authUrl = await zernioAccountConnectUrl(platform, returnUrl.toString());
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Social OAuth unavailable' }, { status: 502 });
  }
}
