import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';

export async function GET() { const jobs = getDb().localJobs.all(); return NextResponse.json({ jobs, summary: { total: jobs.length, queued: jobs.filter((job: any) => job.status === 'queued').length, running: jobs.filter((job: any) => job.status === 'running').length, completed: jobs.filter((job: any) => job.status === 'completed').length, retry: jobs.filter((job: any) => job.status === 'retry').length, failed: jobs.filter((job: any) => job.status === 'failed').length } }); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})); const db = getDb();
  if (body.action === 'run') {
    const limit = Math.min(25, Math.max(1, Number(body.limit) || 1)); const results: { id: string; status: string }[] = [];
    for (const job of db.localJobs.all().filter((item: any) => item.status === 'queued' || (item.status === 'retry' && item.attempts < 3)).slice(0, limit)) {
      db.localJobs.update(job.id, 'failed', `No executor registered for job type: ${job.type}`);
      results.push({ id: job.id, status: 'failed' });
    }
    return NextResponse.json({ ran: results.length, results });
  }
  if (!body.type || typeof body.type !== 'string') return NextResponse.json({ error: 'type is required' }, { status: 400 });
  const now = new Date().toISOString();
  const id = body.id || `job-${Date.now()}`;
  db.localJobs.enqueue({ id, type: body.type, payload: body.payload, createdAt: now });
  return NextResponse.json({ id, status: 'queued' }, { status: 201 });
}
