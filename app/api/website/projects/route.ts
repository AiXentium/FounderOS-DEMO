import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/data';
const Schema = z.object({ id: z.string().optional(), name: z.string().min(1), prompt: z.string().default(''), direction: z.string().default('editorial'), page: z.record(z.unknown()).default({}) });
export async function GET() {
  const projects = await Promise.all(getDb().websiteProjects.all('default').map(async (rawProject: any) => {
    const project = rawProject.page ? rawProject : { ...rawProject, page: typeof rawProject.page_json === 'string' ? JSON.parse(rawProject.page_json) : {} };
    if (project.page?.contentHtml || !project.page?.entryFile) return project;
    const source = await fs.readFile(project.page.entryFile, 'utf8').catch(() => '');
    if (!source) return project;
    const contentHtml = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? source;
    return { ...project, page: { ...project.page, contentHtml } };
  }));
  return NextResponse.json({ projects });
}
export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const now = new Date().toISOString();
  const old = parsed.data.id ? getDb().websiteProjects.all('default').find((p: any) => p.id === parsed.data.id) : undefined;
  const project = { ...parsed.data, id: parsed.data.id ?? randomUUID(), page: { ...(old?.page ?? {}), ...parsed.data.page }, createdAt: old?.created_at ?? now, updatedAt: now };
  getDb().websiteProjects.save(project);
  return NextResponse.json({ project }, { status: 201 });
}
