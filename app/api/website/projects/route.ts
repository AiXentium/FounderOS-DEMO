import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/data';
const Schema = z.object({ id: z.string().optional(), name: z.string().min(1), prompt: z.string().default(''), direction: z.string().default('editorial'), page: z.record(z.unknown()).default({}) });
export async function GET() {
  return NextResponse.json({ projects: getDb().websiteProjects.all('default') });
}
export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const now = new Date().toISOString();
  const old = parsed.data.id ? getDb().websiteProjects.all('default').find((p: any) => p.id === parsed.data.id) : undefined;
  const project = { ...parsed.data, id: parsed.data.id ?? randomUUID(), createdAt: old?.created_at ?? now, updatedAt: now };
  getDb().websiteProjects.save(project);
  return NextResponse.json({ project }, { status: 201 });
}
