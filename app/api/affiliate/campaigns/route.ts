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
