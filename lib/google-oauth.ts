import crypto from 'node:crypto';
import { readEnvLocal, runtimeEnv, upsertEnvLocal } from '@/lib/creds';

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive',
];

export function googleOAuthConfig() {
  const env = runtimeEnv();
  return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI || 'https://os.letstalkmilesandtravel.com/api/google/oauth/callback' };
}

export function createOAuthState() { return crypto.randomBytes(24).toString('hex'); }

export function authorizationUrl(state: string) {
  const { clientId, redirectUri } = googleOAuthConfig();
  if (!clientId) throw new Error('Google OAuth is not configured');
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', access_type: 'offline', prompt: 'consent', scope: GOOGLE_SCOPES.join(' '), state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri } = googleOAuthConfig();
  if (!clientId || !clientSecret) throw new Error('Google OAuth is not configured');
  const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
  const body = await res.json() as { refresh_token?: string; access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !body.refresh_token) throw new Error(body.error || 'Google token exchange failed');
  upsertEnvLocal({ GOOGLE_REFRESH_TOKEN: body.refresh_token });
}

export async function googleAccessToken(env = runtimeEnv()): Promise<string> {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const refreshToken = env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Google OAuth refresh token is not configured');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  const body = await res.json() as { access_token?: string; error?: string };
  if (!res.ok || !body.access_token) throw new Error(body.error || 'Google access token refresh failed');
  return body.access_token;
}
