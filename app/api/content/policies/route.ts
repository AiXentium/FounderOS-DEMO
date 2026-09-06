import { NextResponse } from 'next/server';
import { CONTENT_POLICY_SOURCES, POLICY_UPDATE_LOOP } from '@/lib/content-policy';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ sources: CONTENT_POLICY_SOURCES, updateLoop: POLICY_UPDATE_LOOP, note: 'Policy sources are reference inputs. Production rules change only after human review.' });
}
