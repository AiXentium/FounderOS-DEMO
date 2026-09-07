import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DEFAULT_BRAND_BLUEPRINT } from '@/lib/brand-vault';
import { getDb } from '@/lib/data';

export const dynamic = 'force-dynamic';

const BlueprintSchema = z.object({
  businessName: z.string().trim().max(160).default(''),
  businessType: z.string().trim().max(160).default(''),
  audience: z.string().trim().max(500).default(''),
  offer: z.string().trim().max(500).default(''),
  positioning: z.string().trim().max(1000).default(''),
  voice: z.string().trim().max(1000).default(DEFAULT_BRAND_BLUEPRINT.voice),
  visualDirection: z.string().trim().max(1000).default(DEFAULT_BRAND_BLUEPRINT.visualDirection),
  imageDirection: z.string().trim().max(1000).default(DEFAULT_BRAND_BLUEPRINT.imageDirection),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).default(DEFAULT_BRAND_BLUEPRINT.primaryColor),
  secondaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).default(DEFAULT_BRAND_BLUEPRINT.secondaryColor),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).default(DEFAULT_BRAND_BLUEPRINT.accentColor),
  headingFont: z.string().trim().max(120).default(DEFAULT_BRAND_BLUEPRINT.headingFont),
  bodyFont: z.string().trim().max(120).default(DEFAULT_BRAND_BLUEPRINT.bodyFont),
  logoNotes: z.string().trim().max(1000).default(''),
  frontendTemplateId: z.string().trim().max(160).default(DEFAULT_BRAND_BLUEPRINT.frontendTemplateId),
  backendTemplateId: z.string().trim().max(160).default(DEFAULT_BRAND_BLUEPRINT.backendTemplateId),
  fullStackTemplateId: z.string().trim().max(160).default(DEFAULT_BRAND_BLUEPRINT.fullStackTemplateId),
  channels: z.array(z.string().trim().max(80)).max(20).default(DEFAULT_BRAND_BLUEPRINT.channels),
  approvalStatus: z.enum(['draft', 'review', 'approved']).default('draft'),
});

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get('workspace') || 'default';
  return NextResponse.json({ brand: getDb().brandVault.get(workspaceId) });
}

export async function POST(request: Request) {
  const parsed = BlueprintSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const workspaceId = 'default';
  const previous = db.brandVault.get(workspaceId);
  const now = new Date().toISOString();
  const blueprint = parsed.data;
  const profile = {
    id: previous?.id || `brand-${randomUUID()}`,
    workspaceId,
    businessName: blueprint.businessName,
    businessType: blueprint.businessType,
    status: blueprint.approvalStatus,
    blueprint,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
  db.brandVault.save(profile);
  return NextResponse.json({ brand: profile });
}
