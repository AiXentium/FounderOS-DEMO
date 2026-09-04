import { NextResponse } from 'next/server';
import { zernioLiveAccountDetails } from '@/lib/connectors/zernio';

export const dynamic = 'force-dynamic';

/** Return the live Zernio account roster without exposing provider tokens. */
export async function GET() {
  const accounts = await zernioLiveAccountDetails(true);
  return NextResponse.json({
    connected: accounts.length > 0,
    accounts: accounts.map(({ id, platform, username, displayName, profileUrl, isActive, status }) => ({
      id,
      platform,
      username,
      displayName,
      profileUrl,
      isActive,
      status,
    })),
  });
}
