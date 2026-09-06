import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/data';

export const dynamic = 'force-dynamic';

const Schema = z.object({ assetName: z.string().trim().min(1).max(240), assetType: z.string().trim().min(1).max(40), source: z.string().trim().min(1).max(1000), rightsStatus: z.enum(['cleared', 'pending', 'restricted', 'unknown']), license: z.string().trim().max(500).default(''), expiresAt: z.string().trim().max(40).nullable().default(null), attribution: z.string().trim().max(500).default(''), notes: z.string().trim().max(2000).default('') });

export async function GET() { return NextResponse.json({ assets: getDb().contentProvenance.all() }); }

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const now = new Date().toISOString();
  const record = { id: randomUUID(), ...parsed.data, createdAt: now, updatedAt: now };
  getDb().contentProvenance.save(record);
  return NextResponse.json({ asset: record }, { status: 201 });
}
