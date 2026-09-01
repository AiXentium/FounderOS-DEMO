import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    return NextResponse.json({ ok: true, service: 'business-os-system', timestamp: new Date().toISOString(), database: 'ready', agents: db.agents.all().length, queuedJobs: db.localJobs.all().filter((job: any) => job.status === 'queued').length });
  } catch (error) {
    return NextResponse.json({ ok: false, service: 'business-os-system', error: error instanceof Error ? error.message : 'health check failed' }, { status: 503 });
  }
}
