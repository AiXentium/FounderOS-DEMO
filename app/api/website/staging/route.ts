import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const db = getDb();
  const project = db.websiteProjects.all('default').find((item: any) => item.id === projectId) as any;
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  const review = project.page?.automationReview;
  if (!review || review.status !== 'approved') return NextResponse.json({ error: 'Approve the draft review before creating staging output.' }, { status: 409 });
  const id = randomUUID();
  const root = path.join(process.cwd(), 'data', 'website-staging', id);
  await fs.mkdir(root, { recursive: true });
  const manifest = { id, projectId, projectName: project.name, sourceProtected: true, published: false, createdAt: new Date().toISOString(), pages: review.pages, instructions: 'Staging manifest only. No production deployment is performed by this endpoint.' };
  await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return NextResponse.json({ ok: true, staging: { id, path: root, published: false, pages: review.pages.length } }, { status: 201 });
}
