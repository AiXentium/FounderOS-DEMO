import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildValueFirstPlan } from '@/lib/value-first-content';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  topic: z.string().trim().min(3).max(240),
  audience: z.string().trim().min(3).max(240),
  offer: z.string().trim().min(3).max(240),
  evidence: z.string().trim().max(4000).default(''),
  brandVoice: z.string().trim().max(500).optional(),
  realImages: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json({ plan: buildValueFirstPlan(parsed.data) });
}
