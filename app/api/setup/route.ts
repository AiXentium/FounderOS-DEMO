import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { smartDesignBrief } from '@/lib/ai-studio';
import { buildInitialBrandBlueprint } from '@/lib/brand-vault';
import { getDb } from '@/lib/data';
import { syncAccountingControllerActivation } from '@/lib/accounting-controller';

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.businessType || !body.projectMode) return NextResponse.json({ error: 'businessType and projectMode are required' }, { status: 400 });
  const prompt = `${body.businessType}. ${body.projectMode}. ${body.projectDetails ?? ''}`.trim();
  const brief = await smartDesignBrief(prompt, body.direction ?? 'editorial');
  const now = new Date().toISOString(); const id = randomUUID();
  const db = getDb();
  db.websiteProjects.save({ id, name: body.siteName || `${body.businessType} website`, prompt, direction: body.direction ?? 'editorial', page: {
    brief,
    domain: body.domain ?? '',
    hosting: body.hosting ?? 'choose later',
    businessName: body.siteName ?? '',
    businessType: body.businessType,
    projectMode: body.projectMode,
    projectDetails: body.projectDetails ?? '',
    entityType: body.entityType ?? '',
    country: body.country ?? '',
    region: body.region ?? '',
    taxYear: body.taxYear ?? '',
  }, createdAt: now, updatedAt: now });
  const brand = buildInitialBrandBlueprint({ businessName: body.siteName, businessType: body.businessType, audience: body.audience, offer: body.offer, details: body.projectDetails });
  db.brandVault.save({ id: `brand-${id}`, workspaceId: 'default', businessName: brand.businessName, businessType: brand.businessType, status: 'draft', blueprint: brand, createdAt: now, updatedAt: now });
  syncAccountingControllerActivation(db);
  return NextResponse.json({ project: { id, name: body.siteName || `${body.businessType} website` }, brand, brief: brief.brief, mode: brief.mode, next: 'review-brand-and-templates' }, { status: 201 });
}
