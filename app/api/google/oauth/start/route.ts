import { NextResponse } from 'next/server';
import { authorizationUrl, createOAuthState } from '@/lib/google-oauth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = createOAuthState();
    const response = NextResponse.redirect(authorizationUrl(state));
    response.cookies.set('google_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' });
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Google OAuth unavailable' }, { status: 503 });
  }
}
