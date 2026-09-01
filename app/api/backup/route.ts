import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
export async function GET() { const db = getDb(); return NextResponse.json({ exportedAt: new Date().toISOString(), websiteProjects: db.websiteProjects.all(), products: db.affiliateProducts.all(), campaigns: db.affiliateCampaigns.all(), assets: 'stored in data/assets' }); }

export async function POST(request: Request) {
  const body = await request.json(); const db = getDb();
  for (const project of body.websiteProjects ?? []) if (project.id && project.name) db.websiteProjects.save({ id: project.id, name: project.name, prompt: project.prompt ?? '', direction: project.direction ?? 'editorial', page: project.page ?? {}, createdAt: project.created_at ?? new Date().toISOString(), updatedAt: project.updated_at ?? new Date().toISOString() });
  for (const product of body.products ?? []) if (product.id && product.name) db.affiliateProducts.create({ id: product.id, name: product.name, source: product.source ?? 'restored', url: product.url ?? '', trackedUrl: product.tracked_url ?? product.trackedUrl ?? '', price: product.price, commission: product.commission, status: product.status, createdAt: product.created_at ?? new Date().toISOString() });
  for (const campaign of body.campaigns ?? []) if (campaign.id && campaign.name) db.affiliateCampaigns.create({ id: campaign.id, name: campaign.name, productIds: JSON.parse(campaign.product_ids ?? JSON.stringify(campaign.productIds ?? [])), platforms: JSON.parse(campaign.platforms ?? JSON.stringify(campaign.platforms ?? [])), status: campaign.status, createdAt: campaign.created_at ?? new Date().toISOString() });
  return NextResponse.json({ restored: true });
}
