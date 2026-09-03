import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MCP_CONNECTIONS } from '@/lib/mcp-connections';
import { readEnvLocal, upsertEnvLocal } from '@/lib/creds';

export const dynamic = 'force-dynamic';

const Body = z.object({ id: z.string().min(1), values: z.record(z.string(), z.string().min(1).max(600)) });

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); } catch { return NextResponse.json({ ok: false, error: 'bad body' }, { status: 400 }); }
  const item = MCP_CONNECTIONS.find((entry) => entry.id === body.id);
  if (!item) return NextResponse.json({ ok: false, error: 'unknown connection' }, { status: 400 });
  const allowed = new Set(item.envKeys);
  if (Object.keys(body.values).some((key) => !allowed.has(key))) return NextResponse.json({ ok: false, error: 'unexpected key name' }, { status: 400 });
  if (Object.values(body.values).some((value) => /[\r\n]/.test(value) || !value.trim())) return NextResponse.json({ ok: false, error: 'unsafe value' }, { status: 400 });
  upsertEnvLocal(Object.fromEntries(Object.entries(body.values).map(([key, value]) => [key, value.trim()])));
  const saved = readEnvLocal();
  return NextResponse.json({ ok: true, keySaved: item.envKeys.every((key) => Boolean(saved[key]) || (key === 'VIATOR_MCP_URL' && Boolean(item.defaultUrl))) });
}
