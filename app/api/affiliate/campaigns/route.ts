import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/data';

const Schema = z.object({ name: z.string().min(1), productIds: z.array(z.string()).min(1), platforms: z.array(z.string()).min(1) });
export async function GET() { return NextResponse.json({ campaigns: getDb().affiliateCampaigns.all() }); }
export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const campaign = { id: randomUUID(), ...parsed.data, createdAt: new Date().toISOString() };
  getDb().affiliateCampaigns.create(campaign); return NextResponse.json({ campaign }, { status: 201 });
}
export async function PATCH(request: Request) {
  const parsed = z.object({ id: z.string().min(1), status: z.enum(['draft', 'approved', 'denied']) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const db = getDb();
  const campaigns = db.affiliateCampaigns.all() as unknown as Array<{ id: string; [key: string]: unknown }>;
  const campaign = campaigns.find((item) => item.id === parsed.data.id);
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  db.affiliateCampaigns.updateStatus(parsed.data.id, parsed.data.status);
  return NextResponse.json({ campaign: { ...campaign, status: parsed.data.status } });
}
