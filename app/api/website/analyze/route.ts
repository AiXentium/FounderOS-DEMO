import { NextResponse } from 'next/server';
import { z } from 'zod';
const Schema = z.object({ url: z.string().url() });
export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const target = new URL(parsed.data.url); if (!['http:', 'https:'].includes(target.protocol)) return NextResponse.json({ error: 'only http and https URLs are supported' }, { status: 400 });
  try { const res = await fetch(target, { signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'FounderOS-Website-Analyzer/1.0' } }); const html = (await res.text()).slice(0, 2_000_000); const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? ''; const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ?? ''; const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].slice(0, 20).map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean); return NextResponse.json({ url: target.toString(), title, description, headings, htmlBytes: html.length, mode: 'metadata' }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'analysis failed' }, { status: 502 }); }
}
