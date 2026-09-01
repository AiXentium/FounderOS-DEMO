import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/data';
export async function POST(request: Request) { const body = await request.json().catch(() => ({})); const source = getDb().websiteProjects.all().find((p: any) => p.id === body.id); if (!source) return NextResponse.json({ error: 'project not found' }, { status: 404 }); const now = new Date().toISOString(); const project = { id: randomUUID(), name: `${source.name} copy`, prompt: source.prompt, direction: source.direction, page: source.page, createdAt: now, updatedAt: now }; getDb().websiteProjects.save(project); return NextResponse.json({ project }, { status: 201 }); }
