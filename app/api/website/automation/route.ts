import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/data';

const Schema = z.object({ projectId: z.string().min(1), mode: z.enum(['draft', 'staging']).default('draft') });
const LANES = ['website', 'content', 'seo', 'affiliate', 'brand', 'social'];

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  const project = getDb().websiteProjects.all('default').find((item: any) => item.id === projectId) as any;
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  return NextResponse.json({ review: project.page?.automationReview ?? null, assignments: getDb().projectAgents.all(projectId) });
}

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  const db = getDb();
  const project = db.websiteProjects.all('default').find((item: any) => item.id === parsed.data.projectId) as any;
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  const pages = project.page?.pages ?? project.page?.blocks ?? [];
  const agents = db.agents.all();
  const now = new Date().toISOString();
  for (const lane of LANES) {
    const agent = agents.find((item: any) => String(item.id).includes(lane) || String(item.name).toLowerCase().includes(lane));
    if (agent) db.projectAgents.assign(parsed.data.projectId, agent.id);
  }
  const jobId = randomUUID();
  db.localJobs.enqueue({ id: jobId, type: 'website-project-review', createdAt: now, payload: { projectId: parsed.data.projectId, mode: parsed.data.mode, pages, lanes: LANES, approvalRequired: true, sourceProtected: true, gbrainContext: true } });
  return NextResponse.json({ ok: true, job: { id: jobId, status: 'queued', projectId: parsed.data.projectId, pages: pages.length, lanes: LANES, approvalRequired: true } }, { status: 202 });
}

export async function PATCH(request: Request) {
  const parsed = z.object({ projectId: z.string().min(1), decision: z.enum(['approved', 'rejected']), note: z.string().max(2000).default('') }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'projectId and a valid decision are required.' }, { status: 400 });
  const db = getDb();
  const project = db.websiteProjects.all('default').find((item: any) => item.id === parsed.data.projectId) as any;
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  const review = project.page?.automationReview;
  if (!review) return NextResponse.json({ error: 'No agent review exists for this project.' }, { status: 409 });
  const nextReview = { ...review, status: parsed.data.decision, decisionNote: parsed.data.note, decidedAt: new Date().toISOString() };
  db.websiteProjects.save({ ...project, page: { ...project.page, automationReview: nextReview }, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true, review: nextReview });
}
