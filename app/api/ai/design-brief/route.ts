import { NextResponse } from 'next/server';
import { z } from 'zod';
import { smartDesignBrief } from '@/lib/ai-studio';
import { systemContext } from '@/lib/system-context';
const Schema = z.object({ prompt: z.string().optional(), direction: z.string().optional() });
export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const context = await systemContext(parsed.data.prompt);
  const result = await smartDesignBrief(`${parsed.data.prompt ?? ''}\nUse this Founder OS context: ${JSON.stringify(context).slice(0, 12000)}`, parsed.data.direction);
  return NextResponse.json(result);
}
