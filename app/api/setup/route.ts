import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { smartDesignBrief } from '@/lib/ai-studio';
import { getDb } from '@/lib/data';

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.businessType || !body.projectMode) return NextResponse.json({ error: 'businessType and projectMode are required' }, { status: 400 });
  const prompt = `${body.businessType}. ${body.projectMode}. ${body.projectDetails ?? ''}`.trim();
  const brief = await smartDesignBrief(prompt, body.direction ?? 'editorial');
  const now = new Date().toISOString(); const id = randomUUID();
  getDb().websiteProjects.save({ id, name: body.siteName || `${body.businessType} website`, prompt, direction: body.direction ?? 'editorial', page: { brief, domain: body.domain ?? '', hosting: body.hosting ?? 'choose later' }, createdAt: now, updatedAt: now });
  return NextResponse.json({ project: { id, name: body.siteName || `${body.businessType} website` }, brief: brief.brief, mode: brief.mode, next: 'connect-domain-and-hosting' }, { status: 201 });
}
