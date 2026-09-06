import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { createRuntime } from '@/lib/agents/runtime';
import { realAgents } from '@/lib/agents/real';
import { consumeAiBudget } from '@/lib/ai-guard';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const budget = consumeAiBudget(_req);
  if (!budget.allowed) return NextResponse.json({ error: 'AI request limit reached', retryAfterSeconds: budget.retryAfter }, { status: 429 });
  const { id } = await params;
  const runtime = createRuntime(getDb(), realAgents);
  try {
    const run = await runtime.run(id);
    return NextResponse.json({ run });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 404 },
    );
  }
}
