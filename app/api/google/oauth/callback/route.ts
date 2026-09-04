import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode } from '@/lib/google-oauth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const expected = request.cookies.get('google_oauth_state')?.value;
  if (!state || !expected || state !== expected) return NextResponse.json({ ok: false, error: 'Invalid Google OAuth state' }, { status: 400 });
  const code = url.searchParams.get('code');
  if (!code) return NextResponse.json({ ok: false, error: url.searchParams.get('error') || 'Google authorization was cancelled' }, { status: 400 });
  try {
    await exchangeGoogleCode(code);
    const response = NextResponse.redirect(new URL('/integrations?google=connected', request.url));
    response.cookies.delete('google_oauth_state');
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Google OAuth failed' }, { status: 502 });
  }
}
