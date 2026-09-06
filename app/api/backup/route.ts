import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/data';

const BackupSchema = z.object({
  websiteProjects: z.array(z.record(z.unknown())).max(500).default([]),
  products: z.array(z.record(z.unknown())).max(5000).default([]),
  campaigns: z.array(z.record(z.unknown())).max(1000).default([]),
});

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function scalar(value: unknown): string | undefined {
  if (typeof value === 'string') return value.slice(0, 200);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function jsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const db = getDb();
  return NextResponse.json({ exportedAt: new Date().toISOString(), websiteProjects: db.websiteProjects.all(), products: db.affiliateProducts.all(), campaigns: db.affiliateCampaigns.all(), assets: 'stored in data/assets' });
}

export async function POST(request: Request) {
  const parsed = BackupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const db = getDb();
  const now = new Date().toISOString();
  for (const project of body.websiteProjects) if (typeof project.id === 'string' && typeof project.name === 'string') db.websiteProjects.save({ id: project.id, name: project.name, prompt: text(project.prompt), direction: text(project.direction, 'editorial'), page: project.page && typeof project.page === 'object' ? project.page as Record<string, unknown> : {}, createdAt: text(project.created_at, now), updatedAt: text(project.updated_at, now) });
  for (const product of body.products) if (typeof product.id === 'string' && typeof product.name === 'string') db.affiliateProducts.create({ id: product.id, name: product.name, source: text(product.source, 'restored'), url: text(product.url), trackedUrl: text(product.tracked_url ?? product.trackedUrl), price: scalar(product.price), commission: scalar(product.commission), status: text(product.status), createdAt: text(product.created_at, now) });
  for (const campaign of body.campaigns) if (typeof campaign.id === 'string' && typeof campaign.name === 'string') db.affiliateCampaigns.create({ id: campaign.id, name: campaign.name, productIds: jsonArray(campaign.product_ids ?? campaign.productIds).filter((value): value is string => typeof value === 'string'), platforms: jsonArray(campaign.platforms).filter((value): value is string => typeof value === 'string'), status: text(campaign.status), createdAt: text(campaign.created_at, now) });
  return NextResponse.json({ restored: true });
}
