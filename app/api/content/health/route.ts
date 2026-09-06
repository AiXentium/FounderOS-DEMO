import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/data';

export const dynamic = 'force-dynamic';

const Schema = z.object({ platform: z.string().trim().min(1).max(40), signal: z.enum(['rejected_post', 'copyright_claim', 'reach_drop', 'login_failure', 'api_failure', 'suspended_feature', 'account_suspended', 'warning', 'engagement_anomaly']), severity: z.enum(['info', 'warning', 'critical']), message: z.string().trim().min(1).max(1000) });

export async function GET() { return NextResponse.json({ events: getDb().contentAccountHealth.all() }); }

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const paused = parsed.data.severity === 'critical' || ['copyright_claim', 'suspended_feature', 'account_suspended'].includes(parsed.data.signal);
  const event = { id: randomUUID(), ...parsed.data, paused, observedAt: new Date().toISOString() };
  const db = getDb();
  db.contentAccountHealth.save(event);
  return NextResponse.json({ event, state: db.contentAccountHealth.state([parsed.data.platform]) }, { status: 201 });
}
